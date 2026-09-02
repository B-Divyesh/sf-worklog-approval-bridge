/**
 * The operator-facing release-signing wording is part of the delivery
 * contract. Keep it in one place so the candidate handoff can be checked
 * verbatim before the browser-claim wrappers run.
 */
export const RELEASE_SIGNING_CONTRACT = `## Release signing contract

Desktop signing is an operator-gated release action. Tags and manual runs with
\`sign_release\` set to \`false\` publish unsigned preview packages. An operator
requests signed packages by setting \`sign_release\` to \`true\` and supplying every
platform credential. macOS signing and notarization require \`APPLE_CERTIFICATE\`,
\`APPLE_CERTIFICATE_PASSWORD\`, \`APPLE_SIGNING_IDENTITY\`, \`APPLE_ID\`,
\`APPLE_PASSWORD\`, and \`APPLE_TEAM_ID\`. Windows signing requires
\`WINDOWS_CERT_PFX\` and \`WINDOWS_CERT_PASSWORD\`. A missing signing credential stops
packaging. Signed runs verify macOS signatures, notarization tickets, and Windows
signatures before publication. Every run verifies the source commit and package
checksums.`;
