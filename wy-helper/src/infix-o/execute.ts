import { BlockToken, EndNode } from './parse';

export interface Scope {
  get(key: string): any;
  change(key: string, value: any): void;
}

/**
 * 主函数执行
 * @param node
 * @param scope
 * @returns
 */
function executeExp(env: Env, node: EndNode, scope: Scope): any {
  if (node.type == 'infix') {
    const infixValue = node.infix;
    let infix: any;
    if (infixValue.type == 'ref') {
      infix = infixValue.value;
    } else if (infixValue.type == 'symbol') {
      infix = scope.get(infixValue.value);
    } else {
      infix = executeExp(env, infixValue, scope);
    }
    return doRun(
      env,
      executeExp(env, node.left, scope),
      infix,
      executeExp(env, node.right, scope)
    );
  }
  if (node.type == 'ref') {
    return scope.get(node.value);
  }
  if (node.type == 'block') {
    return new BlockObject(env, node, scope);
  }
  if (node.type == 'nest') {
    return toCustomObject(env, node.body, scope);
  }
  return node.value;
}

export function execute(env: Env, node: EndNode, scope: UserScope): any {
  if (node.type == 'infix') {
    const nodeInfix = node.infix;
    if (nodeInfix.type == 'ref') {
      const infix = nodeInfix.value;
      if (infix == ';') {
        execute(env, node.left, scope);
        return execute(env, node.right, scope);
      }
      if (infix == '=') {
        const left = node.left;
        if (left.type == 'ref') {
          const name = left.value;
          const value = executeExp(env, node.right, scope);
          scope.bind(name, value, true);
          return;
        } else {
          throw new Error(`左边需要是符号,而不是 ${left.type}`);
        }
      }
      if (infix == ':=') {
        const left = node.left;
        if (left.type == 'ref') {
          const name = left.value;
          const value = executeExp(env, node.right, scope);
          scope.bind(name, value, false);
          return;
        } else {
          throw new Error(`左边需要是符号,而不是 ${left.type}`);
        }
      }
      if (infix == '=:') {
        const left = node.left;
        if (left.type == 'ref') {
          const name = left.value;
          const value = executeExp(env, node.right, scope);
          scope.change(name, value);
          return;
        } else {
          throw new Error(`左边需要是符号,而不是 ${left.type}`);
        }
      }
    }
  }
  return executeExp(env, node, scope);
}

/**
 * 向特定对象发送消息
 * @param env
 * @param thisObject
 * @param infix
 * @param value
 * @returns
 */
export function sendMessage(env: Env, thisObject: any, infix: any, value: any) {
  return doRun(env, thisObject, infix, value);
}

export type Env = {
  /**获得块的超类 */
  getBlockSuper(n: BlockObject): any;
  /**默认的超类 */
  objectSuper: any;
  /**获得block的覆盖执行 */
  getBlockInfix(
    left: any,
    infix: any,
    value: any,
    thisObj: any,
    superObj: any
  ): (() => any) | void;
  /**其它的执行 */
  run(left: any, infix: any, value: any, thisObj: any): any;
};

/**
 *
 * @param left
 * @param infix
 * @param value
 * @param thisObj
 * @returns
 */
function doRun(
  env: Env,
  left: any,
  infix: any,
  value: any,
  thisObj: any = left
) {
  if (left instanceof CustomObject) {
    return left.run(infix, value, thisObj);
  }
  if (left instanceof BlockObject) {
    const endNode = env.getBlockInfix(
      left,
      infix,
      value,
      thisObj,
      left.superObject
    );
    if (endNode) {
      return endNode();
    }
    if (infix == 'send') {
      return left.send(value, thisObj);
    }
    return doRun(env, left.superObject, infix, value, thisObj);
  }
  return env.run(left, infix, value, thisObj);
}

class BlockObject {
  readonly superObject: any;
  constructor(
    readonly env: Env,
    readonly node: BlockToken,
    readonly parentScope: Scope
  ) {
    this.superObject = env.getBlockSuper(this);
  }

  send(obj: any, thisObj: any) {
    const scope = new UserScope(this.parentScope);
    scope.bind('this', thisObj, true);
    scope.bind('it', obj, true);
    scope.bind('super', this.superObject, true);
    return execute(this.env, this.node.exp, scope);
  }
}

export class UserScope implements Scope {
  constructor(private parentScope: Scope) {}
  private map = new Map<
    string,
    {
      bind: boolean;
      value: any;
    }
  >();
  bind(key: string, value: any, bind: boolean) {
    if (this.map.has(key)) {
      throw new Error(`${key}已经存在,不能重复绑定`);
    }
    this.map.set(key, {
      bind,
      value,
    });
  }
  get(key: string) {
    const value = this.map.get(key);
    if (value) {
      return value.value;
    }
    return this.parentScope.get(key);
  }
  change(key: string, value: any): void {
    const old = this.map.get(key);
    if (old) {
      if (old.bind) {
        throw new Error('can not change a const value');
      }
      old.value = value;
      return;
    }
    this.parentScope.change(key, value);
  }
}

/**
 * 添加默认的对象未找到方法
 */
class CustomObject {
  constructor(
    readonly env: Env,
    readonly key: any,
    readonly value: EndNode,
    readonly superObject: any,
    readonly parentScope: Scope
  ) {}
  run(infix: string, value: any, thisObj: any): any {
    let a = this as any;
    while (a instanceof CustomObject) {
      if (a.key == infix) {
        const scope = new UserScope(this.parentScope);
        scope.bind('this', thisObj, true);
        scope.bind('it', value, true);
        scope.bind('super', this.superObject, true);
        return execute(this.env, a.value, scope);
      }
      a = a.superObject;
    }
    return doRun(this.env, a, infix, value, this);
  }
}

function toCustomObject(env: Env, node: EndNode, scope: Scope): any {
  if (node.type == 'infix') {
    const infixValue = node.infix;
    if (infixValue.type == 'ref') {
      const infix = infixValue.value;
      if (infix == ',') {
        const part = node.left;
        if (
          part.type == 'infix' &&
          part.infix.type == 'ref' &&
          part.infix.value == '='
        ) {
          const left = part.left;
          const key = getTreeKey(env, left, scope);
          const superObject = toCustomObject(env, node.right, scope);
          return new CustomObject(env, key, part.right, superObject, scope);
        } else {
          throw new Error(`左边必须是等号`);
        }
      } else if (infix == '=') {
        //最后一个是=,默认继承自nil
        const key = getTreeKey(env, node.left, scope);
        return new CustomObject(env, key, node.right, env.objectSuper, scope);
      }
    }
  }
  return executeExp(env, node, scope);
}

function getTreeKey(env: Env, left: EndNode, scope: Scope) {
  if (left.type == 'ref') {
    return left.value;
  } else if (left.type == 'symbol') {
    return scope.get(left.value);
  } else {
    return executeExp(env, left, scope);
  }
}
