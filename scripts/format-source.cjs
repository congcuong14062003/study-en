// Use TypeScript's own printer; no network access or extra dependency required.
const ts = require("typescript");
const fs = require("node:fs");
const path = require("node:path");
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed, removeComments: false });
function formatDirectory(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) formatDirectory(file);
    else if (/\.tsx?$/.test(entry.name)) {
      const source = fs.readFileSync(file, "utf8");
      const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, entry.name.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      if (parsed.parseDiagnostics.length) throw new Error(`Syntax errors in ${file}`);
      const result=ts.transform(parsed,[context=>root=>{
        const visit=node=>{
          node=ts.visitEachChild(node,visit,context);
          if(ts.isBlock(node)){
            const block=ts.factory.createBlock(node.statements,true);
            ts.setOriginalNode(block,node);
            return block;
          }
          return node;
        };
        return ts.visitNode(root,visit);
      }]);
      fs.writeFileSync(file, printer.printFile(result.transformed[0]));
      result.dispose();
    }
  }
}
for (const directory of ["src", "scripts", "tests", "prisma"]) formatDirectory(directory);
console.log("Formatted TypeScript source with the installed TypeScript printer.");
