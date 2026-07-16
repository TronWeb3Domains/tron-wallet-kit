module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Circular dependencies make wallet, UI, and adapter refactors fragile.",
      from: {},
      to: {
        circular: true
      }
    }
  ],
  options: {
    doNotFollow: {
      path: "node_modules|dist|\\.quality|tmp|\\.vitepress/(cache|dist)"
    },
    exclude: {
      path: "node_modules|dist|\\.quality|tmp|\\.vitepress/(cache|dist)"
    },
    tsPreCompilationDeps: false,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"]
    }
  }
};
