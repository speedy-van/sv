module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'next/core-web-vitals',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    },
    project: './tsconfig.eslint.json'
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
    jest: true
  },
  // DEFAULT: Very relaxed for legacy code
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'off',
    'react/jsx-no-undef': 'off',
    'react/jsx-key': 'off',
    'react/no-unescaped-entities': 'off',
    'react/no-children-prop': 'off',
    'react/display-name': 'off',
    'react-hooks/rules-of-hooks': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'prefer-const': 'off',
    'no-var': 'off',
    'no-console': 'off',
    'no-debugger': 'off',
    'no-alert': 'off',
    'no-unused-expressions': 'off',
    'no-duplicate-imports': 'off',
    'no-useless-escape': 'off',
    'no-case-declarations': 'off',
    'no-empty': 'off',
    'no-unused-vars': 'off',
    'no-undef': 'off',
    'no-redeclare': 'off',
    'no-constant-condition': 'off',
    'no-unreachable': 'off',
    'no-inner-declarations': 'off',
    'no-prototype-builtins': 'off',
    'no-duplicate-case': 'off',
    'import/no-anonymous-default-export': 'off',
    '@next/next/no-img-element': 'off',
    '@next/next/no-html-link-for-pages': 'off'
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  overrides: [
    // Test files - keep relaxed
    {
      files: ['**/__tests__/**/*', '**/*.test.*', '**/*.spec.*'],
      env: {
        jest: true,
        node: true
      },
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly'
      }
    },
    
    // NEW CODE: Progressive quality enforcement
    // Enable warnings for new features and components
    {
      files: [
        'src/app/**/*.{ts,tsx}',
        'src/components/**/*.{ts,tsx}',
        'src/features/**/*.{ts,tsx}',
        'src/modules/**/*.{ts,tsx}',
        'src/pages/**/*.{ts,tsx}'
      ],
      rules: {
        // TypeScript - encourage good practices
        '@typescript-eslint/no-unused-vars': ['warn', { 
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }],
        '@typescript-eslint/no-explicit-any': 'warn',
        
        // React - catch common mistakes
        'react/jsx-key': 'warn',
        'react/no-unescaped-entities': 'warn',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        
        // General code quality
        'prefer-const': 'warn',
        'no-var': 'warn',
        'no-debugger': 'warn',
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        'no-duplicate-case': 'error',
        'no-unreachable': 'warn'
      }
    },
    
    // API ROUTES: Stricter for new endpoints
    {
      files: ['src/app/api/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': ['warn', { 
          argsIgnorePattern: '^_|^request|^params|^context'
        }],
        'no-console': 'off', // Allow console in API routes for logging
        'prefer-const': 'warn'
      }
    },
    
    // HOOKS: Enforce React rules strictly
    {
      files: ['src/hooks/**/*.{ts,tsx}'],
      rules: {
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        '@typescript-eslint/no-explicit-any': 'warn'
      }
    },
    
    // UTILS/LIB: Encourage clean code
    {
      files: ['src/lib/**/*.ts', 'src/utils/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': ['warn', { 
          argsIgnorePattern: '^_'
        }],
        '@typescript-eslint/no-explicit-any': 'warn',
        'prefer-const': 'warn',
        'no-var': 'warn'
      }
    }
  ],
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'dist/',
    'coverage/',
    '**/*.config.js',
    'public/',
    '*.js',
    'scripts/**/*.js',
    'pages/**/*.js'
  ]
};