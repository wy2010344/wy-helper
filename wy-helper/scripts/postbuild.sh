#兼容CMD的加载方式

mkdir -p './tokenParser';
echo 'export * from "../dist/tokenParser";' > ./tokenParser.js
echo 'export * from "../dist/tokenParser/index";' > ./tokenParser/index.d.ts


mkdir -p './kanren';
echo 'export * from "../dist/kanren";' > ./kanren/index.js
echo 'export * from "../dist/kanren";' > ./kanren/index.d.ts


mkdir -p './Vue';
echo 'export * from "../dist/Vue";' > ./Vue/index.js
echo 'export * from "../dist/Vue";' > ./Vue/index.d.ts