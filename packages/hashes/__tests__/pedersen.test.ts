const { pedersen } = require("../lib");

describe("Simple Pedersen Hash", () => {
  it("should check if 1 == 1", () => {
    const a = "10";
    const b = "20";
    pedersen(a, b);
  });
});
