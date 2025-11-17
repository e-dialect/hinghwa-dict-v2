// @ts-check
import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import * as parserVue from 'vue-eslint-parser';
import * as parserTs from '@typescript-eslint/parser';
import pluginTs from '@typescript-eslint/eslint-plugin';
import configPrettier from 'eslint-config-prettier';
import globals from 'globals';

import nuxtEslintConfig from '@nuxt/eslint-config';

export default [
  // 全局忽略
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/.nitro/**',
      'unpackage/**',
      'coverage/**',
      '*.d.ts',
      'pnpm-lock.yaml',
    ],
  },

  // JS/TS 文件的通用配置
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.browser,
      parser: parserTs,
    },
    plugins: {
      '@typescript-eslint': pluginTs,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...pluginTs.configs.recommended.rules,
      // 自定义 TS 规则
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // Vue 文件的配置
  {
    files: ['**/*.vue'],
    languageOptions: {
      globals: globals.browser,
      parser: parserVue,
      parserOptions: {
        // 为 <script> 块指定 TS 解析器
        parser: parserTs,
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      vue: pluginVue,
      '@typescript-eslint': pluginTs,
    },
    processor: pluginVue.processors['.vue'],
    rules: {
      ...pluginVue.configs['flat/recommended'].rules,
      ...pluginTs.configs.recommended.rules,
      // 自定义规则
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // 特定子包的配置 (例如 Nuxt)
  {
    files: ['apps/web-nuxt/**/*.{js,ts,vue}'],
    rules: {
      ...nuxtEslintConfig,
    },
  },

  // 特定子包的配置 (例如 uni-app)
  {
    files: ['apps/mobile/**/*.{js,ts,vue}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        uni: 'readonly',
        wx: 'readonly',
        plus: 'readonly',
        getApp: 'readonly',
      },
    },
    rules: {
      // uni-app 特有规则 - 暂时放宽限制以适应旧代码
      'no-console': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-undef': 'off',
      'no-useless-escape': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-prototype-builtins': 'off',
      'no-constant-binary-expression': 'off',
    },
  },

  // 为特定配置文件添加全局变量
  {
  files: ['**/nuxt.config.ts'],
  languageOptions: {
      globals: {
      defineNuxtConfig: 'readonly',
      },
  },
  },

  // Prettier 配置 (必须放在最后)
  configPrettier,
];
