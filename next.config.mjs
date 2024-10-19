// next.config.js
import MiniCssExtractPlugin from "mini-css-extract-plugin";

export function webpack(config, { isServer }) {
    // Add MiniCssExtractPlugin only on the client-side
    if (!isServer) {
        config.plugins.push(
            new MiniCssExtractPlugin({
                filename: "static/css/[name].[contenthash].css",
                chunkFilename: "static/css/[name].[contenthash].css",
            })
        );
    }

    return config;
}
