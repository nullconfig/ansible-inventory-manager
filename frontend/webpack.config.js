const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const fs = require('fs');

module.exports = (env) => {
  // Load environment-specific configuration
  const environment = env?.environment || process.env.ENVIRONMENT || 'production';
  console.log(`Building for environment: ${environment}`);
  
  let configData = {};
  
  try {
    const configFile = path.resolve(__dirname, 'config.json');
    if (fs.existsSync(configFile)) {
      const configContent = fs.readFileSync(configFile, 'utf8');
      console.log('Found config.json file');
      
      // Parse JSON and get environment specific config
      const allConfigs = JSON.parse(configContent);
      
      // Check if the config has the environments key (original format)
      if (allConfigs.environments && allConfigs.environments[environment]) {
        configData = allConfigs.environments[environment];
        console.log(`Loaded configuration for environment '${environment}' from environments key`);
      } 
      // Check if config has direct environment keys (new format)
      else if (allConfigs[environment]) {
        configData = allConfigs[environment];
        console.log(`Loaded configuration for environment '${environment}' from direct key`);
      }
      // Default to production if specific environment not found
      else {
        configData = allConfigs.environments?.production || allConfigs.production || {};
        console.log(`Environment '${environment}' not found, using production defaults`);
      }
      
      console.log('Configuration loaded successfully');
    } else {
      console.warn('config.json file not found, using default configuration');
    }
  } catch (err) {
    console.error('Error loading config:', err);
  }

  return {
    mode: 'development',
    entry: {
      main: ['./src/index.js', './src/styles/tailwind.css'],
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].bundle.js',
      clean: true,
      publicPath: '/',
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'],
            },
          },
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
          ],
        },
        // Add rule for font files
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name][ext]',
          },
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
      new HtmlWebpackPlugin({
        template: './public/index.html',
        filename: 'index.html',
        inject: 'body',
        templateParameters: {
          config: JSON.stringify(configData),
          title: configData.APP_TITLE || 'Ansible Inventory Management'
        }
      }),
    ],
    resolve: {
      extensions: ['.js', '.jsx'],
    },
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      port: 3001,
      open: true,
      hot: true,
      historyApiFallback: true,
    },
  };
};