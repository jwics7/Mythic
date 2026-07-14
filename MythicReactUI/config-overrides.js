const webpack = require('webpack');
module.exports = function override(config, env) {
    config.resolve.fallback = {
        //url: require.resolve('url'),
        fs: false,
        assert: require.resolve('assert'),
        crypto: require.resolve('crypto-browserify'),
        path: require.resolve('path-browserify'),
        //http: require.resolve('stream-http'),
        //https: require.resolve('https-browserify'),
        //os: require.resolve('os-browserify/browser'),
        //buffer: require.resolve('buffer'),
        stream: require.resolve('stream-browserify'),
    };
    // CSS Modules are locally scoped, so their extraction order cannot change
    // selector precedence. Suppress webpack's cross-chunk ordering noise while
    // retaining deterministic CSS emitted from each module.
    config.plugins.forEach((plugin) => {
        if(plugin?.constructor?.name === 'MiniCssExtractPlugin'){
            plugin.options.ignoreOrder = true;
        }
    });
    /*
    config.plugins.push(
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer'],
        }),
    );

     */

    return config;
}
