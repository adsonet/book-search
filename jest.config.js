module.exports = {
    testEnvironment: 'node',
    transform: {
        '^.+.tsx?$': ['ts-jest', {}],
    },
    moduleNameMapper: {
        '^@app/(.*)$': '<rootDir>/src/$1',
        '^@config/(.*)$': '<rootDir>/src/config/$1',
        '^@tests/(.*)$': '<rootDir>/tests/$1',
    },
    testMatch: ['**/tests/**/*.test.ts'],
}
