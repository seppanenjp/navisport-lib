/** jest.config.js */

module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    collectCoverage: true,
    coverageDirectory: "coverage",
    coverageReporters: [
        "lcov",
        "text-summary",
        "html"
    ],

    roots: ["<rootDir>/__tests__/"],

    testMatch: ["**/+(*.)+(test).+(ts)"]
};
