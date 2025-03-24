import { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

function scanPagesDir(pagesDir: string, isFile: (v: string) => boolean): string[] {
  const files: string[] = [];
  function scan(dir: string) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) {
        scan(itemPath); // 递归扫描子目录
      } else if (stat.isFile() && isFile(item)) {
        files.push(itemPath); // 记录 .ts 文件
      }
    }
  }
  scan(pagesDir);
  return files;
}

function generateRouteContent(files: string[], pagesDir: string, regex: RegExp): string {
  let content = 'export default {\n';

  for (const file of files) {
    // 计算相对路径（去掉 pagesDir 前缀和 .ts 后缀）
    const relativePath = path
      .relative(pagesDir, file)
      .replace(regex, '')
      .replace(/\\/g, '/'); // 将 Windows 路径分隔符转换为 Unix 风格

    console.log("files", relativePath)
    // 生成动态导入代码
    content += `  '${relativePath}'() {\n`;
    content += `    return import('./pages/${relativePath}');\n`;
    content += '  },\n';
  }

  content += '};\n';
  return content;
}

/**
 * 其实不再需要 使用 import.meta.glob("./pages/**")就可以将文件夹下所有的模块转变成一个动态导入的列表
 *  import.meta.glob("./pages/*")只处理一层
 *  甚至import.meta.glob("./pages/*.ts")
 * @deprecated
 * @param param0 
 * @returns 
 */
export default function ({
  watchFolder,
  outputFile,
  suffixes = ['ts']
}: {
  watchFolder: string
  outputFile: string
  suffixes?: string[]
}): Plugin {
  const regex = new RegExp(`(${suffixes.map(suffix => `\\.${suffix}`).join('|')})$`)
  const suffixesPlus = suffixes.map(suffix => `.${suffix}`)
  function isFile(name: string) {
    for (let i = 0; i < suffixesPlus.length; i++) {
      const suffix = suffixesPlus[i]
      if (name.endsWith(suffix)) {
        return true
      }
    }
    return false
  }
  function rebuild() {
    // 扫描 pages 目录
    const files = scanPagesDir(watchFolder, isFile);
    // 生成 route.ts 内容
    const content = generateRouteContent(files, watchFolder, regex);
    // 写入 route.ts 文件
    fs.writeFileSync(outputFile, content);
  }
  return {
    name: 'vite-plugin-import-map',
    buildStart() {
      rebuild()
    },
    watchChange(id, change) {
      if (id.startsWith(watchFolder) && change.event != 'update') {
        rebuild()
      }
    },
  };
}