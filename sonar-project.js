// eslint-disable-next-line import/no-extraneous-dependencies
const sonarqubeScanner = require("sonarqube-scanner");

sonarqubeScanner(
  {
    serverUrl: "http://localhost:9000",
    options: {
      "sonar.sources": "src",
      "sonar.tests": "src",
      "sonar.inclusions": "**",
      "sonar.test.inclusions": "src/**/*.spec.js,src/**/*.spec.jsx,src/**/*.test.js,src/**/*.test.jsx",
      "sonar.javascript.lcov.reportPaths": "coverage/lcov.info",
      "sonar.login": "admin",
      "sonar.password": "123",
      "sonar.projectKey": "kekk",
    },
  },
  () => {}
);
