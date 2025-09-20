/**
 *   if (left instanceof ModuleObject) {
     return left.run(infix, value, thisObj)
   }
   if (left instanceof SuperOf) {
     const subLeft = left.value
     if (left.step == 1) {
       //进入object阶段
       return runObject(env, subLeft, infix, value, thisObj)
     }
     if (typeof subLeft == 'string') {
       return runStr(env, subLeft, infix, value, thisObj)
     }
     if (typeof subLeft == 'number') {
       return runNum(env, subLeft, infix, value, thisObj)
     }
     if (subLeft instanceof BlockObject) {
       return runBlock(env, subLeft, infix, value, thisObj)
     }
     if (subLeft instanceof KPair) {
       return runPair(env, subLeft, infix, value, thisObj)
     }
   }
   if (typeof left == 'string') {
     //扩展方法,待办
     const endNode = env.baseDef.String?.[infix]
     if (endNode) {
       return doRunEndNode(env, endNode, left, value, thisObj)
     }
     //原生内置方法
     return runStr(env, left, infix, value, thisObj)
   }
   if (typeof left == 'number') {
     //扩展方法,待办
     const endNode = env.baseDef.Number?.[infix]
     if (endNode) {
       return doRunEndNode(env, endNode, left, value, thisObj)
     }
     //原生内置方法
     return runNum(env, left, infix, value, thisObj)
   }
   if (left instanceof BlockObject) {
     //扩展方法,待办
     const endNode = env.baseDef.Block?.[infix]
     if (endNode) {
       return doRunEndNode(env, endNode, left, value, thisObj)
     }
     //原生内置方法
     return runBlock(env, left, infix, value, thisObj)
   }
   if (left instanceof KPair) {
     //扩展方法,待办
     const endNode = env.baseDef.Pair?.[infix]
     if (endNode) {
       return doRunEndNode(env, endNode, left, value, thisObj)
     }
     //原生内置方法
     return runPair(env, left, infix, value, thisObj)
   }
   if (left == moduleSuperObject) {
     return runModule(env, left, infix, value, thisObj)
   }
   if (left) {
     return runJsObject(env, left, infix, value, thisObj)
   }
   return callMethodNotFound(env, left, infix, value, thisObj)



   function runModule(
     env: Env,
     left: any,
     infix: string,
     value: any,
     thisObj: any
   ) {
     const endNode = env.baseDef.Module?.[infix]
     if (endNode) {
       return doRunEndNode(env, endNode, left, value, thisObj, 1)
     }
     return runObjectWithCommon(env, left, infix, value, thisObj)
   }
   
   function runPair(env: Env, left: any, infix: string, value: any, thisObj: any) {
     if (infix == 'get') {
       return left[value as 'left']
     }
     return runObjectWithCommon(env, left, infix, value, thisObj)
   }
   
   function runBlock(
     env: Env,
     left: any,
     infix: string,
     value: any,
     thisObj: any
   ) {
     if (infix == 'send') {
       return left.send(value)
     }
     return runObjectWithCommon(env, left, infix, value, thisObj)
   }
   function runNum(env: Env, left: any, infix: string, value: any, thisObj: any) {
     let def = numberFun[infix]
     if (def) {
       return def(left, value)
     }
     return runObjectWithCommon(env, left, infix, value, thisObj)
   }
   function runStr(env: Env, left: any, infix: string, value: any, thisObj: any) {
     const fun = left[infix as 'startsWith']
     if (fun) {
       return fun.apply(left, asArray(value) as ['d'])
     }
     return runObjectWithCommon(env, left, infix, value, thisObj)
   }
   
   function doRunEndNode(
     env: Env,
     endNode: EndNode,
     left: any,
     value: any,
     thisObj: any,
     level: number = 0
   ) {
     const scope = new UserScope(env.superScope)
     scope.bind('this', thisObj, true)
     scope.bind('it', value, true)
     scope.bind('super', new SuperOf(left, level), true)
     return execute(env, endNode, scope)
   }
   function runObjectWithCommon(
     env: Env,
     left: any,
     infix: string,
     value: any,
     thisObj: any
   ) {
     const endNode = env.baseDef.Object?.[infix]
     if (endNode) {
       return doRunEndNode(env, endNode, left, value, thisObj, 1)
     }
     return runObject(env, left, infix, value, thisObj)
   }
   function runObject(
     env: Env,
     left: any,
     infix: string,
     value: any,
     thisObj: any
   ) {
     const def = commonFun[infix]
     if (def) {
       return def(left, value)
     }
     return callMethodNotFound(env, left, infix, value, thisObj)
   }
   
   function callMethodNotFound(
     env: Env,
     left: any,
     infix: string,
     value: any,
     thisObj: any
   ): any {
     if (infix != 'methodNotFound') {
       return doRun(env, thisObj, 'methodNotFound', pair(infix, value), thisObj)
     }
     throw new NoMethoeError(`not found method ${infix}`)
   }
   
   class NoMethoeError extends Error {}


   function runJsObject(
     env: Env,
     left: any,
     infix: string,
     value: any,
     thisObj: any
   ) {
     const fun = left[infix]
     if (fun) {
       //js对象
       return fun.apply(left, asArray(value))
     }
     if (infix == 'get') {
       //读属性
       return left[value]
     } else if (infix == 'set') {
       if (value instanceof KPair) {
         left[value.left] = value.right
         return thisObj
       }
     }
     return runObjectWithCommon(env, left, infix, value, thisObj)
   }


   const moduleSuperObject = {}
   export class ModuleObject {
     constructor(
       readonly env: Env,
       readonly defs: Map<string, EndNode>,
       readonly parentScope: Scope
     ) {}
     run(infix: string, value: any, thisObj: any): any {
       const endNode = this.defs.get(infix)
       if (endNode) {
         const scope = new UserScope(this.parentScope)
         scope.bind('this', thisObj, true)
         scope.bind('it', value, true)
         scope.bind('super', moduleSuperObject, true)
         return execute(this.env, endNode, scope)
       }
       return doRun(this.env, moduleSuperObject, infix, value, this)
     }
   }

   
   const numberFun: Record<string, any> = {
     '+'(a: number, b: number) {
       return a + b
     },
     '*'(a: number, b: number) {
       return a * b
     },
     '**'(a: number, b: number) {
       return a ** b
     },
     '-'(a: number, b: number) {
       return a - b
     },
     '/'(a: number, b: number) {
       return a / b
     },
   }
   
   const commonFun: Record<string, any> = {
     ','(a: any, b: any) {
       return pair(a, b)
     },
   }
   function asArray(n: any) {
     const list: any[] = []
     while (n instanceof KPair) {
       list.push(n.left)
       n = n.right
     }
     //保留最后一个,比较简单
     list.push(n)
     return list
   }
   
   type BaseDef = {
     //内置模块
     [key: string]: {
       //内置模块的方法
       [key: string]: EndNode
     }
   }
   
   class SuperOf {
     constructor(readonly value: any, readonly step: number) {}
   }
   
 */
