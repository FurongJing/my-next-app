/** @type {import('next').NextConfig} */
const nextConfig = {}
const withAntdLess = require('next-plugin-antd-less');

module.exports = withAntdLess(nextConfig)
