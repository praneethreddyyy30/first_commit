import cedar from '@cedar-policy/cedar-wasm/nodejs';

const policyText = `permit(
  principal == Citizen::"kavitha",
  action == Action::"apply",
  resource == Scheme::"Pudhumai_Penn"
) when {
  context.annualIncome <= 250000 &&
  context.category == "BC"
};`;

const response = cedar.isAuthorized({
  principal: { type: "Citizen", id: "kavitha" },
  action: { type: "Action", id: "apply" },
  resource: { type: "Scheme", id: "Pudhumai_Penn" },
  context: {
    annualIncome: 180000,
    category: "BC"
  },
  policies: {
    staticPolicies: policyText
  },
  entities: []
});

console.log('Cedar Decision:', JSON.stringify(response, null, 2));
