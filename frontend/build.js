#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Command line args
const args = process.argv.slice(2);
const environment = args[0] || 'development';
const outputDir = args[1] || 'dist';

console.log(`🚀 Building Ansible Inventory UI for ${environment} environment...`);

// Bundle the component files if they exist
const componentsDir = path.join(__dirname, 'components');
let componentsBundle = '';

if (fs.existsSync(componentsDir)) {
  console.log('📦 Bundling React components...');
  try {
    // Check if webpack is available
    try {
      // First try to use a local webpack installation
      execSync('npx webpack --version', { stdio: 'ignore' });
      console.log('Using webpack for bundling');
      
      // Create a temporary webpack config
      const webpackConfigPath = path.join(__dirname, 'webpack.config.temp.js');
      fs.writeFileSync(webpackConfigPath, `
        const path = require('path');
        
        module.exports = {
          mode: '${environment === 'production' ? 'production' : 'development'}',
          entry: './components/index.js',
          output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'components.bundle.js',
            library: 'Components',
            libraryTarget: 'umd'
          },
          module: {
            rules: [
              {
                test: /\\.jsx?$/,
                exclude: /node_modules/,
                use: {
                  loader: 'babel-loader',
                  options: {
                    presets: ['@babel/preset-env', '@babel/preset-react']
                  }
                }
              }
            ]
          },
          externals: {
            'react': 'React',
            'react-dom': 'ReactDOM'
          }
        };
      `);
      
      // Run webpack to bundle the components
      execSync('npx webpack --config webpack.config.temp.js', { stdio: 'inherit' });
      
      componentsBundle = fs.readFileSync(path.join(__dirname, 'dist/components.bundle.js'), 'utf8');
      
      // Clean up
      fs.unlinkSync(webpackConfigPath);
      
    } catch (webpackError) {
      console.log('Webpack not available, using simple concatenation for bundling');
      
      // concatenation as fallback
      const files = fs.readdirSync(componentsDir)
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(componentsDir, file));
      
      // Create UMD wrapper
      componentsBundle = `
        (function(root, factory) {
          if (typeof define === 'function' && define.amd) {
            define(['react'], factory);
          } else if (typeof module === 'object' && module.exports) {
            module.exports = factory(require('react'));
          } else {
            root.Components = factory(root.React);
          }
        })(typeof self !== 'undefined' ? self : this, function(React) {
          const exports = {};
          
          ${files.map(file => fs.readFileSync(file, 'utf8')).join('\n\n')}
          
          return {
            VariablesTable: VariablesTable
          };
        });
      `;
    }
    
    console.log('📦 Components bundled successfully');
  } catch (error) {
    console.error('Error bundling components:', error);
    componentsBundle = '/* Error bundling components */';
  }
}

// Load configuration
try {
  // Read the template HTML
  const templatePath = path.join(__dirname, 'ansible-inventory-template.html');
  let templateContent = fs.readFileSync(templatePath, 'utf8');
  
  // Read the configuration file
  const configPath = path.join(__dirname, 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  if (!config.environments[environment]) {
    console.error(`❌ Environment "${environment}" not found in config.json`);
    process.exit(1);
  }
  
  const envConfig = config.environments[environment];
  console.log(`📝 Using ${environment} configuration`);
  
  // Replace template variables with config values
  Object.entries(envConfig).forEach(([key, value]) => {
    let replacementValue;
    
    // Special handling for font family
    if (key === 'FONT_FAMILY') {
      // Preserve the font family string without adding extra quotes
      replacementValue = value;
    }
    // Handle different types of values
    else if (typeof value === 'boolean' || typeof value === 'number') {
      // Booleans and numbers can be inserted directly
      replacementValue = value;
    } else if (typeof value === 'string') {
      // Special handling for different contexts
      if (key.includes('URL')) {
        // Script URLs should be quoted properly
        replacementValue = `"${value}"`;
      } else if (key.includes('COLOR') || key.includes('BG')) {
        // CSS colors should be without quotes
        replacementValue = value;
      } else if (key.includes('_ICON')) {
        // Icon names should be properly quoted for JavaScript
        replacementValue = `"${value}"`;
      } else {
        replacementValue = JSON.stringify(value);
      }
    } else {
      // For any other type (objects, arrays), use JSON
      replacementValue = JSON.stringify(value);
    }
    
    // Replace variables with a fallback pattern {{ VAR || "default" }}
    const fallbackRegex = new RegExp(`{{ ${key} \\|\\| .*? }}`, 'g');
    templateContent = templateContent.replace(fallbackRegex, replacementValue);
    
    // Replace simple variables {{ VAR }}
    const simpleRegex = new RegExp(`{{ ${key} }}`, 'g');
    templateContent = templateContent.replace(simpleRegex, replacementValue);
  });
  
  // Replace any remaining fallback variables with their default values
  templateContent = templateContent.replace(/{{ (\w+) \|\| (.*?) }}/g, (match, name, defaultValue) => {
    // Handle different types of default values
    if (defaultValue === 'true') return true;
    if (defaultValue === 'false') return false;
    if (!isNaN(defaultValue) && defaultValue.trim() !== '') return Number(defaultValue);
    
    // Check if this is a URL, color, or icon value
    if (name.includes('URL')) {
      return `"${defaultValue}"`;
    } else if (name.includes('COLOR') || name.includes('BG')) {
      return defaultValue;
    } else if (name.includes('_ICON')) {
      return `"${defaultValue}"`;
    } else {
      return JSON.stringify(defaultValue);
    }
  });
  
  // Insert the components bundle into the template
  if (componentsBundle) {
    // Add a placeholder in the template for components bundle
    const componentsPlaceholder = '<!-- COMPONENTS_BUNDLE_PLACEHOLDER -->';
    
    // If the placeholder doesn't exist yet, add it before the closing </head>
    if (!templateContent.includes(componentsPlaceholder)) {
      templateContent = templateContent.replace('</head>', `  ${componentsPlaceholder}\n</head>`);
    }
    
    // Replace the placeholder with the actual components bundle
    templateContent = templateContent.replace(
      componentsPlaceholder, 
      `<script type="text/javascript">\n${componentsBundle}\n  </script>`
    );
  }
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write the output file
  const outputPath = path.join(outputDir, 'index.html');
  fs.writeFileSync(outputPath, templateContent);
  
  // Create a basic error page
  const errorHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Error - Ansible Inventory</title>
  <style>
    body { font-family: sans-serif; text-align: center; padding: 50px; }
    h1 { color: #e53e3e; }
    p { margin: 20px 0; }
    a { color: #3182ce; text-decoration: none; }
  </style>
</head>
<body>
  <h1>Something went wrong</h1>
  <p>Sorry, we encountered an error while processing your request.</p>
  <p><a href="/">Return to home page</a></p>
</body>
</html>
  `;
  fs.writeFileSync(path.join(outputDir, 'error.html'), errorHtml);
  
  // Create a debug html file to view the raw output
  const debugHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Debug - Ansible Inventory</title>
  <style>
    body { font-family: monospace; padding: 20px; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow: auto; }
  </style>
</head>
<body>
  <h1>Generated HTML (Debug View)</h1>
  <pre>${templateContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>
  `;
  fs.writeFileSync(path.join(outputDir, 'debug.html'), debugHtml);
  
  console.log(`✅ Build complete! Output written to ${outputPath}`);
  console.log(`📝 Debug view available at ${path.join(outputDir, 'debug.html')}`);
} catch (error) {
  console.error(`❌ Error during build:`, error);
  process.exit(1);
}