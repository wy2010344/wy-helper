/**
 目前考虑准实时的
 数据库影子同步
 库名变,配置变,都是删除,而不是迁移
 或者...
 如果index,table分开配置,无法保证单顺序
 */
export type IndexedDBConfig = {
  name: string;
  upgradeneeded: ((idbReq: IndexedDBReq, e: IDBVersionChangeEvent) => void)[];
  //有新页面进行了版本升级,旧页面接收到通知,一般关闭数据库或重新加载页面
  onversionchange?: (idbReq: IndexedDBReq, e: IDBVersionChangeEvent) => void;
  //有旧版本页面且旧版本页面未处理versionchange,不能顺利升级
  onblocked?: (e: IDBVersionChangeEvent) => void;
};

export type IndexedDBReq = {
  result: IDBDatabase;
  transaction: IDBTransaction;
};

export function getIndexedDB(config: IndexedDBConfig) {
  return new Promise<IDBDatabase>(function (resolve, reject) {
    let called = false;
    function addVersionChange() {
      if (called) {
        return;
      }
      called = true;
      if (config.onversionchange) {
        idbReq.result.addEventListener('versionchange', function (e) {
          config.onversionchange!(idbReq as any, e);
        });
      }
    }
    const idbReq = indexedDB.open(config.name, config.upgradeneeded.length);
    if (config.onblocked) {
      idbReq.addEventListener('blocked', function (e) {
        config.onblocked!(e as any);
      });
    }
    idbReq.addEventListener('error', err => {
      console.error(`open indexDB ${config.name}`, err);
      reject(err);
    });
    //blocked在新页面升级版本时,旧页面没有在versionchange里添加上db.close时触发,即升级失败(不会发生)
    // idbReq.addEventListener("blocked", function (e) {
    //   console.log("请关闭其他打开了该站点的标签页！");
    // })
    idbReq.addEventListener('upgradeneeded', ev => {
      //第一次创建,更新版本号
      //唯一可以更改数据库的地方
      console.info(
        `open indexDB upgradeneeded ${config.name} from ${ev.oldVersion} to ${ev.newVersion}`,
        ev
      );
      addVersionChange();
      for (let i = ev.oldVersion; i < config.upgradeneeded.length; i++) {
        config.upgradeneeded[i](idbReq as any, ev);
      }
    });
    idbReq.addEventListener('success', ev => {
      //如果有upgradeneeded,在upgradeneeded之后
      console.info(`open indexDB success ${config.name}`, ev);
      addVersionChange();
      resolve(idbReq.result);
    });
  });
}

export function getIDBRequestPromise<T>(req: IDBRequest<any>) {
  return new Promise<T>(function (resolve, reject) {
    req.addEventListener('success', function (e) {
      resolve(req.result);
    });
    req.addEventListener('error', function (e) {
      reject(req.error);
    });
  });
}

export function getIDBTransactionPromise(trans: IDBTransaction) {
  return new Promise<any>(function (resolve, reject) {
    trans.addEventListener('complete', resolve);
    trans.addEventListener('abort', function () {
      reject(trans.error);
    });
  });
}

export function buildGetIDBObjectStoreAndTrans<M extends readonly string[]>(
  getIdb: () => IDBDatabase,
  tables: M
) {
  type KM = M[number];
  return function <
    T extends {
      [key in KM]?: true;
    },
  >(map: T, mode?: IDBTransactionMode) {
    const list: KM[] = [];
    for (const key in map) {
      if (map[key as KM] && tables.includes(key)) {
        list.push(key);
      }
    }
    const trans = getIdb().transaction(list as string[], mode);
    const retMap: {
      [k in keyof T]: IDBObjectStore;
    } = {} as any;
    list.forEach(key => {
      retMap[key] = trans.objectStore(key as string);
    });
    return [retMap, trans] as const;
  };
}

/**
 * 删除Index上某个匹配的值
 * @param store
 * @param index
 * @param value
 */
export function removeIndexOnly(
  store: IDBObjectStore,
  index: IDBIndex,
  value: string | number
) {
  const c = index.openKeyCursor(IDBKeyRange.only(value));
  c.addEventListener('success', function (e) {
    const cursor = c.result;
    if (cursor) {
      // 删除匹配的数据
      store.delete(cursor.primaryKey);
      cursor.continue();
    }
  });
}
