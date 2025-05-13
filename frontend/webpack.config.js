const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const fs = require('fs');

module.exports = (env) => {
  // Load environment-specific configuration
  const environment = env.environment || 'production';
  let configData = {};
  
  try {
    const configFile = path.resolve(__dirname, 'config.json');
    if (fs.existsSync(configFile)) {
      const configContent = fs.readFileSync(configFile, 'utf8');
      const allConfigs = JSON.parse(configContent);
      configData = allConfigs[environment] || allConfigs.production || {};
      
      console.log(`Loaded configuration for environment: ${environment}`);
    }
  } catch (err) {
    console.error('Error loading config:', err);
  }

  return {
    entry: {
      main: ['./src/index.js', './src/styles/tailwind.css'],
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].bundle.js',
      clean: true,
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
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
      new HtmlWebpackPlugin({
        template: './public/index.html',
        filename: 'index.html',
        scriptLoading: 'blocking',
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
      port: 3000,
      open: true,
    },
  };
};