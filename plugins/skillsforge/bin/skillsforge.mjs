#!/usr/bin/env node
import { createRequire as __createRequire } from 'node:module';
const require = __createRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS({
  "node_modules/yaml/dist/nodes/identity.js"(exports) {
    "use strict";
    var ALIAS = /* @__PURE__ */ Symbol.for("yaml.alias");
    var DOC = /* @__PURE__ */ Symbol.for("yaml.document");
    var MAP = /* @__PURE__ */ Symbol.for("yaml.map");
    var PAIR = /* @__PURE__ */ Symbol.for("yaml.pair");
    var SCALAR = /* @__PURE__ */ Symbol.for("yaml.scalar");
    var SEQ = /* @__PURE__ */ Symbol.for("yaml.seq");
    var NODE_TYPE = /* @__PURE__ */ Symbol.for("yaml.node.type");
    var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
    var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
    var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
    var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
    var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
    var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
    function isCollection(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case MAP:
          case SEQ:
            return true;
        }
      return false;
    }
    function isNode(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case ALIAS:
          case MAP:
          case SCALAR:
          case SEQ:
            return true;
        }
      return false;
    }
    var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
    exports.ALIAS = ALIAS;
    exports.DOC = DOC;
    exports.MAP = MAP;
    exports.NODE_TYPE = NODE_TYPE;
    exports.PAIR = PAIR;
    exports.SCALAR = SCALAR;
    exports.SEQ = SEQ;
    exports.hasAnchor = hasAnchor;
    exports.isAlias = isAlias;
    exports.isCollection = isCollection;
    exports.isDocument = isDocument;
    exports.isMap = isMap;
    exports.isNode = isNode;
    exports.isPair = isPair;
    exports.isScalar = isScalar;
    exports.isSeq = isSeq;
  }
});

// node_modules/yaml/dist/visit.js
var require_visit = __commonJS({
  "node_modules/yaml/dist/visit.js"(exports) {
    "use strict";
    var identity = require_identity();
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove node");
    function visit(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        visit_(null, node, visitor_, Object.freeze([]));
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    function visit_(key, node, visitor, path) {
      const ctrl = callVisitor(key, node, visitor, path);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path, ctrl);
        return visit_(key, ctrl, visitor, path);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path = Object.freeze(path.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = visit_(i, node.items[i], visitor, path);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path = Object.freeze(path.concat(node));
          const ck = visit_("key", node.key, visitor, path);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = visit_("value", node.value, visitor, path);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    async function visitAsync(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        await visitAsync_(null, node, visitor_, Object.freeze([]));
    }
    visitAsync.BREAK = BREAK;
    visitAsync.SKIP = SKIP;
    visitAsync.REMOVE = REMOVE;
    async function visitAsync_(key, node, visitor, path) {
      const ctrl = await callVisitor(key, node, visitor, path);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path, ctrl);
        return visitAsync_(key, ctrl, visitor, path);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path = Object.freeze(path.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = await visitAsync_(i, node.items[i], visitor, path);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path = Object.freeze(path.concat(node));
          const ck = await visitAsync_("key", node.key, visitor, path);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = await visitAsync_("value", node.value, visitor, path);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    function initVisitor(visitor) {
      if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
        return Object.assign({
          Alias: visitor.Node,
          Map: visitor.Node,
          Scalar: visitor.Node,
          Seq: visitor.Node
        }, visitor.Value && {
          Map: visitor.Value,
          Scalar: visitor.Value,
          Seq: visitor.Value
        }, visitor.Collection && {
          Map: visitor.Collection,
          Seq: visitor.Collection
        }, visitor);
      }
      return visitor;
    }
    function callVisitor(key, node, visitor, path) {
      if (typeof visitor === "function")
        return visitor(key, node, path);
      if (identity.isMap(node))
        return visitor.Map?.(key, node, path);
      if (identity.isSeq(node))
        return visitor.Seq?.(key, node, path);
      if (identity.isPair(node))
        return visitor.Pair?.(key, node, path);
      if (identity.isScalar(node))
        return visitor.Scalar?.(key, node, path);
      if (identity.isAlias(node))
        return visitor.Alias?.(key, node, path);
      return void 0;
    }
    function replaceNode(key, path, node) {
      const parent = path[path.length - 1];
      if (identity.isCollection(parent)) {
        parent.items[key] = node;
      } else if (identity.isPair(parent)) {
        if (key === "key")
          parent.key = node;
        else
          parent.value = node;
      } else if (identity.isDocument(parent)) {
        parent.contents = node;
      } else {
        const pt = identity.isAlias(parent) ? "alias" : "scalar";
        throw new Error(`Cannot replace node with ${pt} parent`);
      }
    }
    exports.visit = visit;
    exports.visitAsync = visitAsync;
  }
});

// node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS({
  "node_modules/yaml/dist/doc/directives.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    var escapeChars = {
      "!": "%21",
      ",": "%2C",
      "[": "%5B",
      "]": "%5D",
      "{": "%7B",
      "}": "%7D"
    };
    var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
    var Directives = class _Directives {
      constructor(yaml, tags) {
        this.docStart = null;
        this.docEnd = false;
        this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
        this.tags = Object.assign({}, _Directives.defaultTags, tags);
      }
      clone() {
        const copy = new _Directives(this.yaml, this.tags);
        copy.docStart = this.docStart;
        return copy;
      }
      /**
       * During parsing, get a Directives instance for the current document and
       * update the stream state according to the current version's spec.
       */
      atDocument() {
        const res = new _Directives(this.yaml, this.tags);
        switch (this.yaml.version) {
          case "1.1":
            this.atNextDocument = true;
            break;
          case "1.2":
            this.atNextDocument = false;
            this.yaml = {
              explicit: _Directives.defaultYaml.explicit,
              version: "1.2"
            };
            this.tags = Object.assign({}, _Directives.defaultTags);
            break;
        }
        return res;
      }
      /**
       * @param onError - May be called even if the action was successful
       * @returns `true` on success
       */
      add(line, onError) {
        if (this.atNextDocument) {
          this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
          this.tags = Object.assign({}, _Directives.defaultTags);
          this.atNextDocument = false;
        }
        const parts = line.trim().split(/[ \t]+/);
        const name = parts.shift();
        switch (name) {
          case "%TAG": {
            if (parts.length !== 2) {
              onError(0, "%TAG directive should contain exactly two parts");
              if (parts.length < 2)
                return false;
            }
            const [handle, prefix] = parts;
            this.tags[handle] = prefix;
            return true;
          }
          case "%YAML": {
            this.yaml.explicit = true;
            if (parts.length !== 1) {
              onError(0, "%YAML directive should contain exactly one part");
              return false;
            }
            const [version] = parts;
            if (version === "1.1" || version === "1.2") {
              this.yaml.version = version;
              return true;
            } else {
              const isValid = /^\d+\.\d+$/.test(version);
              onError(6, `Unsupported YAML version ${version}`, isValid);
              return false;
            }
          }
          default:
            onError(0, `Unknown directive ${name}`, true);
            return false;
        }
      }
      /**
       * Resolves a tag, matching handles to those defined in %TAG directives.
       *
       * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
       *   `'!local'` tag, or `null` if unresolvable.
       */
      tagName(source, onError) {
        if (source === "!")
          return "!";
        if (source[0] !== "!") {
          onError(`Not a valid tag: ${source}`);
          return null;
        }
        if (source[1] === "<") {
          const verbatim = source.slice(2, -1);
          if (verbatim === "!" || verbatim === "!!") {
            onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
            return null;
          }
          if (source[source.length - 1] !== ">")
            onError("Verbatim tags must end with a >");
          return verbatim;
        }
        const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
        if (!suffix)
          onError(`The ${source} tag has no suffix`);
        const prefix = this.tags[handle];
        if (prefix) {
          try {
            return prefix + decodeURIComponent(suffix);
          } catch (error) {
            onError(String(error));
            return null;
          }
        }
        if (handle === "!")
          return source;
        onError(`Could not resolve tag: ${source}`);
        return null;
      }
      /**
       * Given a fully resolved tag, returns its printable string form,
       * taking into account current tag prefixes and defaults.
       */
      tagString(tag) {
        for (const [handle, prefix] of Object.entries(this.tags)) {
          if (tag.startsWith(prefix))
            return handle + escapeTagName(tag.substring(prefix.length));
        }
        return tag[0] === "!" ? tag : `!<${tag}>`;
      }
      toString(doc) {
        const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
        const tagEntries = Object.entries(this.tags);
        let tagNames;
        if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
          const tags = {};
          visit.visit(doc.contents, (_key, node) => {
            if (identity.isNode(node) && node.tag)
              tags[node.tag] = true;
          });
          tagNames = Object.keys(tags);
        } else
          tagNames = [];
        for (const [handle, prefix] of tagEntries) {
          if (handle === "!!" && prefix === "tag:yaml.org,2002:")
            continue;
          if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
            lines.push(`%TAG ${handle} ${prefix}`);
        }
        return lines.join("\n");
      }
    };
    Directives.defaultYaml = { explicit: false, version: "1.2" };
    Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
    exports.Directives = Directives;
  }
});

// node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS({
  "node_modules/yaml/dist/doc/anchors.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    function anchorIsValid(anchor) {
      if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
        const sa = JSON.stringify(anchor);
        const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
        throw new Error(msg);
      }
      return true;
    }
    function anchorNames(root) {
      const anchors = /* @__PURE__ */ new Set();
      visit.visit(root, {
        Value(_key, node) {
          if (node.anchor)
            anchors.add(node.anchor);
        }
      });
      return anchors;
    }
    function findNewAnchor(prefix, exclude) {
      for (let i = 1; true; ++i) {
        const name = `${prefix}${i}`;
        if (!exclude.has(name))
          return name;
      }
    }
    function createNodeAnchors(doc, prefix) {
      const aliasObjects = [];
      const sourceObjects = /* @__PURE__ */ new Map();
      let prevAnchors = null;
      return {
        onAnchor: (source) => {
          aliasObjects.push(source);
          prevAnchors ?? (prevAnchors = anchorNames(doc));
          const anchor = findNewAnchor(prefix, prevAnchors);
          prevAnchors.add(anchor);
          return anchor;
        },
        /**
         * With circular references, the source node is only resolved after all
         * of its child nodes are. This is why anchors are set only after all of
         * the nodes have been created.
         */
        setAnchors: () => {
          for (const source of aliasObjects) {
            const ref = sourceObjects.get(source);
            if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
              ref.node.anchor = ref.anchor;
            } else {
              const error = new Error("Failed to resolve repeated object (this should not happen)");
              error.source = source;
              throw error;
            }
          }
        },
        sourceObjects
      };
    }
    exports.anchorIsValid = anchorIsValid;
    exports.anchorNames = anchorNames;
    exports.createNodeAnchors = createNodeAnchors;
    exports.findNewAnchor = findNewAnchor;
  }
});

// node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS({
  "node_modules/yaml/dist/doc/applyReviver.js"(exports) {
    "use strict";
    function applyReviver(reviver, obj, key, val) {
      if (val && typeof val === "object") {
        if (Array.isArray(val)) {
          for (let i = 0, len = val.length; i < len; ++i) {
            const v0 = val[i];
            const v1 = applyReviver(reviver, val, String(i), v0);
            if (v1 === void 0)
              delete val[i];
            else if (v1 !== v0)
              val[i] = v1;
          }
        } else if (val instanceof Map) {
          for (const k of Array.from(val.keys())) {
            const v0 = val.get(k);
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              val.delete(k);
            else if (v1 !== v0)
              val.set(k, v1);
          }
        } else if (val instanceof Set) {
          for (const v0 of Array.from(val)) {
            const v1 = applyReviver(reviver, val, v0, v0);
            if (v1 === void 0)
              val.delete(v0);
            else if (v1 !== v0) {
              val.delete(v0);
              val.add(v1);
            }
          }
        } else {
          for (const [k, v0] of Object.entries(val)) {
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              delete val[k];
            else if (v1 !== v0)
              val[k] = v1;
          }
        }
      }
      return reviver.call(obj, key, val);
    }
    exports.applyReviver = applyReviver;
  }
});

// node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS({
  "node_modules/yaml/dist/nodes/toJS.js"(exports) {
    "use strict";
    var identity = require_identity();
    function toJS(value, arg, ctx) {
      if (Array.isArray(value))
        return value.map((v, i) => toJS(v, String(i), ctx));
      if (value && typeof value.toJSON === "function") {
        if (!ctx || !identity.hasAnchor(value))
          return value.toJSON(arg, ctx);
        const data = { aliasCount: 0, count: 1, res: void 0 };
        ctx.anchors.set(value, data);
        ctx.onCreate = (res2) => {
          data.res = res2;
          delete ctx.onCreate;
        };
        const res = value.toJSON(arg, ctx);
        if (ctx.onCreate)
          ctx.onCreate(res);
        return res;
      }
      if (typeof value === "bigint" && !ctx?.keep)
        return Number(value);
      return value;
    }
    exports.toJS = toJS;
  }
});

// node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS({
  "node_modules/yaml/dist/nodes/Node.js"(exports) {
    "use strict";
    var applyReviver = require_applyReviver();
    var identity = require_identity();
    var toJS = require_toJS();
    var NodeBase = class {
      constructor(type) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: type });
      }
      /** Create a copy of this node.  */
      clone() {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** A plain JavaScript representation of this node. */
      toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        if (!identity.isDocument(doc))
          throw new TypeError("A document argument is required");
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc,
          keep: true,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this, "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
    };
    exports.NodeBase = NodeBase;
  }
});

// node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS({
  "node_modules/yaml/dist/nodes/Alias.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var visit = require_visit();
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var Alias = class extends Node.NodeBase {
      constructor(source) {
        super(identity.ALIAS);
        this.source = source;
        Object.defineProperty(this, "tag", {
          set() {
            throw new Error("Alias nodes cannot have tags");
          }
        });
      }
      /**
       * Resolve the value of this alias within `doc`, finding the last
       * instance of the `source` anchor before this node.
       */
      resolve(doc, ctx) {
        if (ctx?.maxAliasCount === 0)
          throw new ReferenceError("Alias resolution is disabled");
        let nodes;
        if (ctx?.aliasResolveCache) {
          nodes = ctx.aliasResolveCache;
        } else {
          nodes = [];
          visit.visit(doc, {
            Node: (_key, node) => {
              if (identity.isAlias(node) || identity.hasAnchor(node))
                nodes.push(node);
            }
          });
          if (ctx)
            ctx.aliasResolveCache = nodes;
        }
        let found = void 0;
        for (const node of nodes) {
          if (node === this)
            break;
          if (node.anchor === this.source)
            found = node;
        }
        return found;
      }
      toJSON(_arg, ctx) {
        if (!ctx)
          return { source: this.source };
        const { anchors: anchors2, doc, maxAliasCount } = ctx;
        const source = this.resolve(doc, ctx);
        if (!source) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new ReferenceError(msg);
        }
        let data = anchors2.get(source);
        if (!data) {
          toJS.toJS(source, null, ctx);
          data = anchors2.get(source);
        }
        if (data?.res === void 0) {
          const msg = "This should not happen: Alias anchor was not resolved?";
          throw new ReferenceError(msg);
        }
        if (maxAliasCount >= 0) {
          data.count += 1;
          if (data.aliasCount === 0)
            data.aliasCount = getAliasCount(doc, source, anchors2);
          if (data.count * data.aliasCount > maxAliasCount) {
            const msg = "Excessive alias count indicates a resource exhaustion attack";
            throw new ReferenceError(msg);
          }
        }
        return data.res;
      }
      toString(ctx, _onComment, _onChompKeep) {
        const src = `*${this.source}`;
        if (ctx) {
          anchors.anchorIsValid(this.source);
          if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
            throw new Error(msg);
          }
          if (ctx.implicitKey)
            return `${src} `;
        }
        return src;
      }
    };
    function getAliasCount(doc, node, anchors2) {
      if (identity.isAlias(node)) {
        const source = node.resolve(doc);
        const anchor = anchors2 && source && anchors2.get(source);
        return anchor ? anchor.count * anchor.aliasCount : 0;
      } else if (identity.isCollection(node)) {
        let count = 0;
        for (const item of node.items) {
          const c = getAliasCount(doc, item, anchors2);
          if (c > count)
            count = c;
        }
        return count;
      } else if (identity.isPair(node)) {
        const kc = getAliasCount(doc, node.key, anchors2);
        const vc = getAliasCount(doc, node.value, anchors2);
        return Math.max(kc, vc);
      }
      return 1;
    }
    exports.Alias = Alias;
  }
});

// node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS({
  "node_modules/yaml/dist/nodes/Scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
    var Scalar = class extends Node.NodeBase {
      constructor(value) {
        super(identity.SCALAR);
        this.value = value;
      }
      toJSON(arg, ctx) {
        return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
      }
      toString() {
        return String(this.value);
      }
    };
    Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
    Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
    Scalar.PLAIN = "PLAIN";
    Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
    Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
    exports.Scalar = Scalar;
    exports.isScalarValue = isScalarValue;
  }
});

// node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS({
  "node_modules/yaml/dist/doc/createNode.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var defaultTagPrefix = "tag:yaml.org,2002:";
    function findTagObject(value, tagName, tags) {
      if (tagName) {
        const match = tags.filter((t) => t.tag === tagName);
        const tagObj = match.find((t) => !t.format) ?? match[0];
        if (!tagObj)
          throw new Error(`Tag ${tagName} not found`);
        return tagObj;
      }
      return tags.find((t) => t.identify?.(value) && !t.format);
    }
    function createNode(value, tagName, ctx) {
      if (identity.isDocument(value))
        value = value.contents;
      if (identity.isNode(value))
        return value;
      if (identity.isPair(value)) {
        const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
        map.items.push(value);
        return map;
      }
      if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
        value = value.valueOf();
      }
      const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
      let ref = void 0;
      if (aliasDuplicateObjects && value && typeof value === "object") {
        ref = sourceObjects.get(value);
        if (ref) {
          ref.anchor ?? (ref.anchor = onAnchor(value));
          return new Alias.Alias(ref.anchor);
        } else {
          ref = { anchor: null, node: null };
          sourceObjects.set(value, ref);
        }
      }
      if (tagName?.startsWith("!!"))
        tagName = defaultTagPrefix + tagName.slice(2);
      let tagObj = findTagObject(value, tagName, schema.tags);
      if (!tagObj) {
        if (value && typeof value.toJSON === "function") {
          value = value.toJSON();
        }
        if (!value || typeof value !== "object") {
          const node2 = new Scalar.Scalar(value);
          if (ref)
            ref.node = node2;
          return node2;
        }
        tagObj = value instanceof Map ? schema[identity.MAP] : Symbol.iterator in Object(value) ? schema[identity.SEQ] : schema[identity.MAP];
      }
      if (onTagObj) {
        onTagObj(tagObj);
        delete ctx.onTagObj;
      }
      const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
      if (tagName)
        node.tag = tagName;
      else if (!tagObj.default)
        node.tag = tagObj.tag;
      if (ref)
        ref.node = node;
      return node;
    }
    exports.createNode = createNode;
  }
});

// node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS({
  "node_modules/yaml/dist/nodes/Collection.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var identity = require_identity();
    var Node = require_Node();
    function collectionFromPath(schema, path, value) {
      let v = value;
      for (let i = path.length - 1; i >= 0; --i) {
        const k = path[i];
        if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
          const a = [];
          a[k] = v;
          v = a;
        } else {
          v = /* @__PURE__ */ new Map([[k, v]]);
        }
      }
      return createNode.createNode(v, void 0, {
        aliasDuplicateObjects: false,
        keepUndefined: false,
        onAnchor: () => {
          throw new Error("This should not happen, please report a bug.");
        },
        schema,
        sourceObjects: /* @__PURE__ */ new Map()
      });
    }
    var isEmptyPath = (path) => path == null || typeof path === "object" && !!path[Symbol.iterator]().next().done;
    var Collection = class extends Node.NodeBase {
      constructor(type, schema) {
        super(type);
        Object.defineProperty(this, "schema", {
          value: schema,
          configurable: true,
          enumerable: false,
          writable: true
        });
      }
      /**
       * Create a copy of this collection.
       *
       * @param schema - If defined, overwrites the original's schema
       */
      clone(schema) {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (schema)
          copy.schema = schema;
        copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /**
       * Adds a value to the collection. For `!!map` and `!!omap` the value must
       * be a Pair instance or a `{ key, value }` object, which may not have a key
       * that already exists in the map.
       */
      addIn(path, value) {
        if (isEmptyPath(path))
          this.add(value);
        else {
          const [key, ...rest] = path;
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.addIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
      /**
       * Removes a value from the collection.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path) {
        const [key, ...rest] = path;
        if (rest.length === 0)
          return this.delete(key);
        const node = this.get(key, true);
        if (identity.isCollection(node))
          return node.deleteIn(rest);
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path, keepScalar) {
        const [key, ...rest] = path;
        const node = this.get(key, true);
        if (rest.length === 0)
          return !keepScalar && identity.isScalar(node) ? node.value : node;
        else
          return identity.isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
      }
      hasAllNullValues(allowScalar) {
        return this.items.every((node) => {
          if (!identity.isPair(node))
            return false;
          const n = node.value;
          return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
        });
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       */
      hasIn(path) {
        const [key, ...rest] = path;
        if (rest.length === 0)
          return this.has(key);
        const node = this.get(key, true);
        return identity.isCollection(node) ? node.hasIn(rest) : false;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path, value) {
        const [key, ...rest] = path;
        if (rest.length === 0) {
          this.set(key, value);
        } else {
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.setIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
    };
    exports.Collection = Collection;
    exports.collectionFromPath = collectionFromPath;
    exports.isEmptyPath = isEmptyPath;
  }
});

// node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyComment.js"(exports) {
    "use strict";
    var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
    function indentComment(comment, indent) {
      if (/^\n+$/.test(comment))
        return comment.substring(1);
      return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
    }
    var lineComment = (str, indent, comment) => str.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
    exports.indentComment = indentComment;
    exports.lineComment = lineComment;
    exports.stringifyComment = stringifyComment;
  }
});

// node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS({
  "node_modules/yaml/dist/stringify/foldFlowLines.js"(exports) {
    "use strict";
    var FOLD_FLOW = "flow";
    var FOLD_BLOCK = "block";
    var FOLD_QUOTED = "quoted";
    function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
      if (!lineWidth || lineWidth < 0)
        return text;
      if (lineWidth < minContentWidth)
        minContentWidth = 0;
      const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
      if (text.length <= endStep)
        return text;
      const folds = [];
      const escapedFolds = {};
      let end = lineWidth - indent.length;
      if (typeof indentAtStart === "number") {
        if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
          folds.push(0);
        else
          end = lineWidth - indentAtStart;
      }
      let split = void 0;
      let prev = void 0;
      let overflow = false;
      let i = -1;
      let escStart = -1;
      let escEnd = -1;
      if (mode === FOLD_BLOCK) {
        i = consumeMoreIndentedLines(text, i, indent.length);
        if (i !== -1)
          end = i + endStep;
      }
      for (let ch; ch = text[i += 1]; ) {
        if (mode === FOLD_QUOTED && ch === "\\") {
          escStart = i;
          switch (text[i + 1]) {
            case "x":
              i += 3;
              break;
            case "u":
              i += 5;
              break;
            case "U":
              i += 9;
              break;
            default:
              i += 1;
          }
          escEnd = i;
        }
        if (ch === "\n") {
          if (mode === FOLD_BLOCK)
            i = consumeMoreIndentedLines(text, i, indent.length);
          end = i + indent.length + endStep;
          split = void 0;
        } else {
          if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
            const next = text[i + 1];
            if (next && next !== " " && next !== "\n" && next !== "	")
              split = i;
          }
          if (i >= end) {
            if (split) {
              folds.push(split);
              end = split + endStep;
              split = void 0;
            } else if (mode === FOLD_QUOTED) {
              while (prev === " " || prev === "	") {
                prev = ch;
                ch = text[i += 1];
                overflow = true;
              }
              const j = i > escEnd + 1 ? i - 2 : escStart - 1;
              if (escapedFolds[j])
                return text;
              folds.push(j);
              escapedFolds[j] = true;
              end = j + endStep;
              split = void 0;
            } else {
              overflow = true;
            }
          }
        }
        prev = ch;
      }
      if (overflow && onOverflow)
        onOverflow();
      if (folds.length === 0)
        return text;
      if (onFold)
        onFold();
      let res = text.slice(0, folds[0]);
      for (let i2 = 0; i2 < folds.length; ++i2) {
        const fold = folds[i2];
        const end2 = folds[i2 + 1] || text.length;
        if (fold === 0)
          res = `
${indent}${text.slice(0, end2)}`;
        else {
          if (mode === FOLD_QUOTED && escapedFolds[fold])
            res += `${text[fold]}\\`;
          res += `
${indent}${text.slice(fold + 1, end2)}`;
        }
      }
      return res;
    }
    function consumeMoreIndentedLines(text, i, indent) {
      let end = i;
      let start = i + 1;
      let ch = text[start];
      while (ch === " " || ch === "	") {
        if (i < start + indent) {
          ch = text[++i];
        } else {
          do {
            ch = text[++i];
          } while (ch && ch !== "\n");
          end = i;
          start = i + 1;
          ch = text[start];
        }
      }
      return end;
    }
    exports.FOLD_BLOCK = FOLD_BLOCK;
    exports.FOLD_FLOW = FOLD_FLOW;
    exports.FOLD_QUOTED = FOLD_QUOTED;
    exports.foldFlowLines = foldFlowLines;
  }
});

// node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyString.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var foldFlowLines = require_foldFlowLines();
    var getFoldOptions = (ctx, isBlock) => ({
      indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
      lineWidth: ctx.options.lineWidth,
      minContentWidth: ctx.options.minContentWidth
    });
    var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
    function lineLengthOverLimit(str, lineWidth, indentLength) {
      if (!lineWidth || lineWidth < 0)
        return false;
      const limit = lineWidth - indentLength;
      const strLen = str.length;
      if (strLen <= limit)
        return false;
      for (let i = 0, start = 0; i < strLen; ++i) {
        if (str[i] === "\n") {
          if (i - start > limit)
            return true;
          start = i + 1;
          if (strLen - start <= limit)
            return false;
        }
      }
      return true;
    }
    function doubleQuotedString(value, ctx) {
      const json = JSON.stringify(value);
      if (ctx.options.doubleQuotedAsJSON)
        return json;
      const { implicitKey } = ctx;
      const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      let str = "";
      let start = 0;
      for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
        if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
          str += json.slice(start, i) + "\\ ";
          i += 1;
          start = i;
          ch = "\\";
        }
        if (ch === "\\")
          switch (json[i + 1]) {
            case "u":
              {
                str += json.slice(start, i);
                const code = json.substr(i + 2, 4);
                switch (code) {
                  case "0000":
                    str += "\\0";
                    break;
                  case "0007":
                    str += "\\a";
                    break;
                  case "000b":
                    str += "\\v";
                    break;
                  case "001b":
                    str += "\\e";
                    break;
                  case "0085":
                    str += "\\N";
                    break;
                  case "00a0":
                    str += "\\_";
                    break;
                  case "2028":
                    str += "\\L";
                    break;
                  case "2029":
                    str += "\\P";
                    break;
                  default:
                    if (code.substr(0, 2) === "00")
                      str += "\\x" + code.substr(2);
                    else
                      str += json.substr(i, 6);
                }
                i += 5;
                start = i + 1;
              }
              break;
            case "n":
              if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
                i += 1;
              } else {
                str += json.slice(start, i) + "\n\n";
                while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                  str += "\n";
                  i += 2;
                }
                str += indent;
                if (json[i + 2] === " ")
                  str += "\\";
                i += 1;
                start = i + 1;
              }
              break;
            default:
              i += 1;
          }
      }
      str = start ? str + json.slice(start) : json;
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
    }
    function singleQuotedString(value, ctx) {
      if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
        return doubleQuotedString(value, ctx);
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
      return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function quotedString(value, ctx) {
      const { singleQuote } = ctx.options;
      let qs;
      if (singleQuote === false)
        qs = doubleQuotedString;
      else {
        const hasDouble = value.includes('"');
        const hasSingle = value.includes("'");
        if (hasDouble && !hasSingle)
          qs = singleQuotedString;
        else if (hasSingle && !hasDouble)
          qs = doubleQuotedString;
        else
          qs = singleQuote ? singleQuotedString : doubleQuotedString;
      }
      return qs(value, ctx);
    }
    var blockEndNewlines;
    try {
      blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
    } catch {
      blockEndNewlines = /\n+(?!\n|$)/g;
    }
    function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
      const { blockQuote, commentString, lineWidth } = ctx.options;
      if (!blockQuote || /\n[\t ]+$/.test(value)) {
        return quotedString(value, ctx);
      }
      const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
      const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
      if (!value)
        return literal ? "|\n" : ">\n";
      let chomp;
      let endStart;
      for (endStart = value.length; endStart > 0; --endStart) {
        const ch = value[endStart - 1];
        if (ch !== "\n" && ch !== "	" && ch !== " ")
          break;
      }
      let end = value.substring(endStart);
      const endNlPos = end.indexOf("\n");
      if (endNlPos === -1) {
        chomp = "-";
      } else if (value === end || endNlPos !== end.length - 1) {
        chomp = "+";
        if (onChompKeep)
          onChompKeep();
      } else {
        chomp = "";
      }
      if (end) {
        value = value.slice(0, -end.length);
        if (end[end.length - 1] === "\n")
          end = end.slice(0, -1);
        end = end.replace(blockEndNewlines, `$&${indent}`);
      }
      let startWithSpace = false;
      let startEnd;
      let startNlPos = -1;
      for (startEnd = 0; startEnd < value.length; ++startEnd) {
        const ch = value[startEnd];
        if (ch === " ")
          startWithSpace = true;
        else if (ch === "\n")
          startNlPos = startEnd;
        else
          break;
      }
      let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
      if (start) {
        value = value.substring(start.length);
        start = start.replace(/\n+/g, `$&${indent}`);
      }
      const indentSize = indent ? "2" : "1";
      let header = (startWithSpace ? indentSize : "") + chomp;
      if (comment) {
        header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
        if (onComment)
          onComment();
      }
      if (!literal) {
        const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
        let literalFallback = false;
        const foldOptions = getFoldOptions(ctx, true);
        if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
          foldOptions.onOverflow = () => {
            literalFallback = true;
          };
        }
        const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
        if (!literalFallback)
          return `>${header}
${indent}${body}`;
      }
      value = value.replace(/\n+/g, `$&${indent}`);
      return `|${header}
${indent}${start}${value}${end}`;
    }
    function plainString(item, ctx, onComment, onChompKeep) {
      const { type, value } = item;
      const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
      if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
        return quotedString(value, ctx);
      }
      if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
        return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
      }
      if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes("\n")) {
        return blockString(item, ctx, onComment, onChompKeep);
      }
      if (containsDocumentMarker(value)) {
        if (indent === "") {
          ctx.forceBlockIndent = true;
          return blockString(item, ctx, onComment, onChompKeep);
        } else if (implicitKey && indent === indentStep) {
          return quotedString(value, ctx);
        }
      }
      const str = value.replace(/\n+/g, `$&
${indent}`);
      if (actualString) {
        const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
        const { compat, tags } = ctx.doc.schema;
        if (tags.some(test) || compat?.some(test))
          return quotedString(value, ctx);
      }
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function stringifyString(item, ctx, onComment, onChompKeep) {
      const { implicitKey, inFlow } = ctx;
      const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
      let { type } = item;
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
          type = Scalar.Scalar.QUOTE_DOUBLE;
      }
      const _stringify = (_type) => {
        switch (_type) {
          case Scalar.Scalar.BLOCK_FOLDED:
          case Scalar.Scalar.BLOCK_LITERAL:
            return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
          case Scalar.Scalar.QUOTE_DOUBLE:
            return doubleQuotedString(ss.value, ctx);
          case Scalar.Scalar.QUOTE_SINGLE:
            return singleQuotedString(ss.value, ctx);
          case Scalar.Scalar.PLAIN:
            return plainString(ss, ctx, onComment, onChompKeep);
          default:
            return null;
        }
      };
      let res = _stringify(type);
      if (res === null) {
        const { defaultKeyType, defaultStringType } = ctx.options;
        const t = implicitKey && defaultKeyType || defaultStringType;
        res = _stringify(t);
        if (res === null)
          throw new Error(`Unsupported default string type ${t}`);
      }
      return res;
    }
    exports.stringifyString = stringifyString;
  }
});

// node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS({
  "node_modules/yaml/dist/stringify/stringify.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var identity = require_identity();
    var stringifyComment = require_stringifyComment();
    var stringifyString = require_stringifyString();
    function createStringifyContext(doc, options) {
      const opt = Object.assign({
        blockQuote: true,
        commentString: stringifyComment.stringifyComment,
        defaultKeyType: null,
        defaultStringType: "PLAIN",
        directives: null,
        doubleQuotedAsJSON: false,
        doubleQuotedMinMultiLineLength: 40,
        falseStr: "false",
        flowCollectionPadding: true,
        indentSeq: true,
        lineWidth: 80,
        minContentWidth: 20,
        nullStr: "null",
        simpleKeys: false,
        singleQuote: null,
        trailingComma: false,
        trueStr: "true",
        verifyAliasOrder: true
      }, doc.schema.toStringOptions, options);
      let inFlow;
      switch (opt.collectionStyle) {
        case "block":
          inFlow = false;
          break;
        case "flow":
          inFlow = true;
          break;
        default:
          inFlow = null;
      }
      return {
        anchors: /* @__PURE__ */ new Set(),
        doc,
        flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
        indent: "",
        indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
        inFlow,
        options: opt
      };
    }
    function getTagObject(tags, item) {
      if (item.tag) {
        const match = tags.filter((t) => t.tag === item.tag);
        if (match.length > 0)
          return match.find((t) => t.format === item.format) ?? match[0];
      }
      let tagObj = void 0;
      let obj;
      if (identity.isScalar(item)) {
        obj = item.value;
        let match = tags.filter((t) => t.identify?.(obj));
        if (match.length > 1) {
          const testMatch = match.filter((t) => t.test);
          if (testMatch.length > 0)
            match = testMatch;
        }
        tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
      } else {
        obj = item;
        tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
      }
      if (!tagObj) {
        const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
        throw new Error(`Tag not resolved for ${name} value`);
      }
      return tagObj;
    }
    function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
      if (!doc.directives)
        return "";
      const props = [];
      const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
      if (anchor && anchors.anchorIsValid(anchor)) {
        anchors$1.add(anchor);
        props.push(`&${anchor}`);
      }
      const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
      if (tag)
        props.push(doc.directives.tagString(tag));
      return props.join(" ");
    }
    function stringify3(item, ctx, onComment, onChompKeep) {
      if (identity.isPair(item))
        return item.toString(ctx, onComment, onChompKeep);
      if (identity.isAlias(item)) {
        if (ctx.doc.directives)
          return item.toString(ctx);
        if (ctx.resolvedAliases?.has(item)) {
          throw new TypeError(`Cannot stringify circular structure without alias nodes`);
        } else {
          if (ctx.resolvedAliases)
            ctx.resolvedAliases.add(item);
          else
            ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
          item = item.resolve(ctx.doc);
        }
      }
      let tagObj = void 0;
      const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
      tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
      const props = stringifyProps(node, tagObj, ctx);
      if (props.length > 0)
        ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
      const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
      if (!props)
        return str;
      return identity.isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
    }
    exports.createStringifyContext = createStringifyContext;
    exports.stringify = stringify3;
  }
});

// node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyPair.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var stringify3 = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
      const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
      let keyComment = identity.isNode(key) && key.comment || null;
      if (simpleKeys) {
        if (keyComment) {
          throw new Error("With simple keys, key nodes cannot have comments");
        }
        if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
          const msg = "With simple keys, collection cannot be used as a key value";
          throw new Error(msg);
        }
      }
      let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
      ctx = Object.assign({}, ctx, {
        allNullValues: false,
        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
        indent: indent + indentStep
      });
      let keyCommentDone = false;
      let chompKeep = false;
      let str = stringify3.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
      if (!explicitKey && !ctx.inFlow && str.length > 1024) {
        if (simpleKeys)
          throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
        explicitKey = true;
      }
      if (ctx.inFlow) {
        if (allNullValues || value == null) {
          if (keyCommentDone && onComment)
            onComment();
          return str === "" ? "?" : explicitKey ? `? ${str}` : str;
        }
      } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
        str = `? ${str}`;
        if (keyComment && !keyCommentDone) {
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        } else if (chompKeep && onChompKeep)
          onChompKeep();
        return str;
      }
      if (keyCommentDone)
        keyComment = null;
      if (explicitKey) {
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        str = `? ${str}
${indent}:`;
      } else {
        str = `${str}:`;
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      }
      let vsb, vcb, valueComment;
      if (identity.isNode(value)) {
        vsb = !!value.spaceBefore;
        vcb = value.commentBefore;
        valueComment = value.comment;
      } else {
        vsb = false;
        vcb = null;
        valueComment = null;
        if (value && typeof value === "object")
          value = doc.createNode(value);
      }
      ctx.implicitKey = false;
      if (!explicitKey && !keyComment && identity.isScalar(value))
        ctx.indentAtStart = str.length + 1;
      chompKeep = false;
      if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
        ctx.indent = ctx.indent.substring(2);
      }
      let valueCommentDone = false;
      const valueStr = stringify3.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
      let ws = " ";
      if (keyComment || vsb || vcb) {
        ws = vsb ? "\n" : "";
        if (vcb) {
          const cs = commentString(vcb);
          ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
        }
        if (valueStr === "" && !ctx.inFlow) {
          if (ws === "\n" && valueComment)
            ws = "\n\n";
        } else {
          ws += `
${ctx.indent}`;
        }
      } else if (!explicitKey && identity.isCollection(value)) {
        const vs0 = valueStr[0];
        const nl0 = valueStr.indexOf("\n");
        const hasNewline = nl0 !== -1;
        const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
        if (hasNewline || !flow) {
          let hasPropsLine = false;
          if (hasNewline && (vs0 === "&" || vs0 === "!")) {
            let sp0 = valueStr.indexOf(" ");
            if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
              sp0 = valueStr.indexOf(" ", sp0 + 1);
            }
            if (sp0 === -1 || nl0 < sp0)
              hasPropsLine = true;
          }
          if (!hasPropsLine)
            ws = `
${ctx.indent}`;
        }
      } else if (valueStr === "" || valueStr[0] === "\n") {
        ws = "";
      }
      str += ws + valueStr;
      if (ctx.inFlow) {
        if (valueCommentDone && onComment)
          onComment();
      } else if (valueComment && !valueCommentDone) {
        str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
      } else if (chompKeep && onChompKeep) {
        onChompKeep();
      }
      return str;
    }
    exports.stringifyPair = stringifyPair;
  }
});

// node_modules/yaml/dist/log.js
var require_log = __commonJS({
  "node_modules/yaml/dist/log.js"(exports) {
    "use strict";
    var node_process = __require("process");
    function debug(logLevel, ...messages) {
      if (logLevel === "debug")
        console.log(...messages);
    }
    function warn(logLevel, warning) {
      if (logLevel === "debug" || logLevel === "warn") {
        if (typeof node_process.emitWarning === "function")
          node_process.emitWarning(warning);
        else
          console.warn(warning);
      }
    }
    exports.debug = debug;
    exports.warn = warn;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/merge.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var MERGE_KEY = "<<";
    var merge = {
      identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
      default: "key",
      tag: "tag:yaml.org,2002:merge",
      test: /^<<$/,
      resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
        addToJSMap: addMergeToJSMap
      }),
      stringify: () => MERGE_KEY
    };
    var isMergeKey = (ctx, key) => (merge.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
    function addMergeToJSMap(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (identity.isSeq(source))
        for (const it of source.items)
          mergeValue(ctx, map, it);
      else if (Array.isArray(source))
        for (const it of source)
          mergeValue(ctx, map, it);
      else
        mergeValue(ctx, map, source);
    }
    function mergeValue(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (!identity.isMap(source))
        throw new Error("Merge sources must be maps or map aliases");
      const srcMap = source.toJSON(null, ctx, Map);
      for (const [key, value2] of srcMap) {
        if (map instanceof Map) {
          if (!map.has(key))
            map.set(key, value2);
        } else if (map instanceof Set) {
          map.add(key);
        } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
          Object.defineProperty(map, key, {
            value: value2,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
      return map;
    }
    function resolveAliasValue(ctx, value) {
      return ctx && identity.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
    }
    exports.addMergeToJSMap = addMergeToJSMap;
    exports.isMergeKey = isMergeKey;
    exports.merge = merge;
  }
});

// node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS({
  "node_modules/yaml/dist/nodes/addPairToJSMap.js"(exports) {
    "use strict";
    var log = require_log();
    var merge = require_merge();
    var stringify3 = require_stringify();
    var identity = require_identity();
    var toJS = require_toJS();
    function addPairToJSMap(ctx, map, { key, value }) {
      if (identity.isNode(key) && key.addToJSMap)
        key.addToJSMap(ctx, map, value);
      else if (merge.isMergeKey(ctx, key))
        merge.addMergeToJSMap(ctx, map, value);
      else {
        const jsKey = toJS.toJS(key, "", ctx);
        if (map instanceof Map) {
          map.set(jsKey, toJS.toJS(value, jsKey, ctx));
        } else if (map instanceof Set) {
          map.add(jsKey);
        } else {
          const stringKey = stringifyKey(key, jsKey, ctx);
          const jsValue = toJS.toJS(value, stringKey, ctx);
          if (stringKey in map)
            Object.defineProperty(map, stringKey, {
              value: jsValue,
              writable: true,
              enumerable: true,
              configurable: true
            });
          else
            map[stringKey] = jsValue;
        }
      }
      return map;
    }
    function stringifyKey(key, jsKey, ctx) {
      if (jsKey === null)
        return "";
      if (typeof jsKey !== "object")
        return String(jsKey);
      if (identity.isNode(key) && ctx?.doc) {
        const strCtx = stringify3.createStringifyContext(ctx.doc, {});
        strCtx.anchors = /* @__PURE__ */ new Set();
        for (const node of ctx.anchors.keys())
          strCtx.anchors.add(node.anchor);
        strCtx.inFlow = true;
        strCtx.inStringifyKey = true;
        const strKey = key.toString(strCtx);
        if (!ctx.mapKeyWarned) {
          let jsonStr = JSON.stringify(strKey);
          if (jsonStr.length > 40)
            jsonStr = jsonStr.substring(0, 36) + '..."';
          log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
          ctx.mapKeyWarned = true;
        }
        return strKey;
      }
      return JSON.stringify(jsKey);
    }
    exports.addPairToJSMap = addPairToJSMap;
  }
});

// node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS({
  "node_modules/yaml/dist/nodes/Pair.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyPair = require_stringifyPair();
    var addPairToJSMap = require_addPairToJSMap();
    var identity = require_identity();
    function createPair(key, value, ctx) {
      const k = createNode.createNode(key, void 0, ctx);
      const v = createNode.createNode(value, void 0, ctx);
      return new Pair(k, v);
    }
    var Pair = class _Pair {
      constructor(key, value = null) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
        this.key = key;
        this.value = value;
      }
      clone(schema) {
        let { key, value } = this;
        if (identity.isNode(key))
          key = key.clone(schema);
        if (identity.isNode(value))
          value = value.clone(schema);
        return new _Pair(key, value);
      }
      toJSON(_, ctx) {
        const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        return addPairToJSMap.addPairToJSMap(ctx, pair, this);
      }
      toString(ctx, onComment, onChompKeep) {
        return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
      }
    };
    exports.Pair = Pair;
    exports.createPair = createPair;
  }
});

// node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyCollection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify3 = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyCollection(collection, ctx, options) {
      const flow = ctx.inFlow ?? collection.flow;
      const stringify4 = flow ? stringifyFlowCollection : stringifyBlockCollection;
      return stringify4(collection, ctx, options);
    }
    function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
      const { indent, options: { commentString } } = ctx;
      const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
      let chompKeep = false;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment2 = null;
        if (identity.isNode(item)) {
          if (!chompKeep && item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
          if (item.comment)
            comment2 = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (!chompKeep && ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
          }
        }
        chompKeep = false;
        let str2 = stringify3.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
        if (comment2)
          str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment2));
        if (chompKeep && comment2)
          chompKeep = false;
        lines.push(blockItemPrefix + str2);
      }
      let str;
      if (lines.length === 0) {
        str = flowChars.start + flowChars.end;
      } else {
        str = lines[0];
        for (let i = 1; i < lines.length; ++i) {
          const line = lines[i];
          str += line ? `
${indent}${line}` : "\n";
        }
      }
      if (comment) {
        str += "\n" + stringifyComment.indentComment(commentString(comment), indent);
        if (onComment)
          onComment();
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str;
    }
    function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
      const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
      itemIndent += indentStep;
      const itemCtx = Object.assign({}, ctx, {
        indent: itemIndent,
        inFlow: true,
        type: null
      });
      let reqNewline = false;
      let linesAtValue = 0;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment = null;
        if (identity.isNode(item)) {
          if (item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, false);
          if (item.comment)
            comment = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, false);
            if (ik.comment)
              reqNewline = true;
          }
          const iv = identity.isNode(item.value) ? item.value : null;
          if (iv) {
            if (iv.comment)
              comment = iv.comment;
            if (iv.commentBefore)
              reqNewline = true;
          } else if (item.value == null && ik?.comment) {
            comment = ik.comment;
          }
        }
        if (comment)
          reqNewline = true;
        let str = stringify3.stringify(item, itemCtx, () => comment = null);
        reqNewline || (reqNewline = lines.length > linesAtValue || str.includes("\n"));
        if (i < items.length - 1) {
          str += ",";
        } else if (ctx.options.trailingComma) {
          if (ctx.options.lineWidth > 0) {
            reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
          }
          if (reqNewline) {
            str += ",";
          }
        }
        if (comment)
          str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
        lines.push(str);
        linesAtValue = lines.length;
      }
      const { start, end } = flowChars;
      if (lines.length === 0) {
        return start + end;
      } else {
        if (!reqNewline) {
          const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
          reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
        }
        if (reqNewline) {
          let str = start;
          for (const line of lines)
            str += line ? `
${indentStep}${indent}${line}` : "\n";
          return `${str}
${indent}${end}`;
        } else {
          return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
        }
      }
    }
    function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
      if (comment && chompKeep)
        comment = comment.replace(/^\n+/, "");
      if (comment) {
        const ic = stringifyComment.indentComment(commentString(comment), indent);
        lines.push(ic.trimStart());
      }
    }
    exports.stringifyCollection = stringifyCollection;
  }
});

// node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLMap.js"(exports) {
    "use strict";
    var stringifyCollection = require_stringifyCollection();
    var addPairToJSMap = require_addPairToJSMap();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    function findPair(items, key) {
      const k = identity.isScalar(key) ? key.value : key;
      for (const it of items) {
        if (identity.isPair(it)) {
          if (it.key === key || it.key === k)
            return it;
          if (identity.isScalar(it.key) && it.key.value === k)
            return it;
        }
      }
      return void 0;
    }
    var YAMLMap = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:map";
      }
      constructor(schema) {
        super(identity.MAP, schema);
        this.items = [];
      }
      /**
       * A generic collection parsing method that can be extended
       * to other node classes that inherit from YAMLMap
       */
      static from(schema, obj, ctx) {
        const { keepUndefined, replacer } = ctx;
        const map = new this(schema);
        const add = (key, value) => {
          if (typeof replacer === "function")
            value = replacer.call(obj, key, value);
          else if (Array.isArray(replacer) && !replacer.includes(key))
            return;
          if (value !== void 0 || keepUndefined)
            map.items.push(Pair.createPair(key, value, ctx));
        };
        if (obj instanceof Map) {
          for (const [key, value] of obj)
            add(key, value);
        } else if (obj && typeof obj === "object") {
          for (const key of Object.keys(obj))
            add(key, obj[key]);
        }
        if (typeof schema.sortMapEntries === "function") {
          map.items.sort(schema.sortMapEntries);
        }
        return map;
      }
      /**
       * Adds a value to the collection.
       *
       * @param overwrite - If not set `true`, using a key that is already in the
       *   collection will throw. Otherwise, overwrites the previous value.
       */
      add(pair, overwrite) {
        let _pair;
        if (identity.isPair(pair))
          _pair = pair;
        else if (!pair || typeof pair !== "object" || !("key" in pair)) {
          _pair = new Pair.Pair(pair, pair?.value);
        } else
          _pair = new Pair.Pair(pair.key, pair.value);
        const prev = findPair(this.items, _pair.key);
        const sortEntries = this.schema?.sortMapEntries;
        if (prev) {
          if (!overwrite)
            throw new Error(`Key ${_pair.key} already set`);
          if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
            prev.value.value = _pair.value;
          else
            prev.value = _pair.value;
        } else if (sortEntries) {
          const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
          if (i === -1)
            this.items.push(_pair);
          else
            this.items.splice(i, 0, _pair);
        } else {
          this.items.push(_pair);
        }
      }
      delete(key) {
        const it = findPair(this.items, key);
        if (!it)
          return false;
        const del = this.items.splice(this.items.indexOf(it), 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const it = findPair(this.items, key);
        const node = it?.value;
        return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? void 0;
      }
      has(key) {
        return !!findPair(this.items, key);
      }
      set(key, value) {
        this.add(new Pair.Pair(key, value), true);
      }
      /**
       * @param ctx - Conversion context, originally set in Document#toJS()
       * @param {Class} Type - If set, forces the returned collection type
       * @returns Instance of Type, Map, or Object
       */
      toJSON(_, ctx, Type) {
        const map = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const item of this.items)
          addPairToJSMap.addPairToJSMap(ctx, map, item);
        return map;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        for (const item of this.items) {
          if (!identity.isPair(item))
            throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
        }
        if (!ctx.allNullValues && this.hasAllNullValues(false))
          ctx = Object.assign({}, ctx, { allNullValues: true });
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "",
          flowChars: { start: "{", end: "}" },
          itemIndent: ctx.indent || "",
          onChompKeep,
          onComment
        });
      }
    };
    exports.YAMLMap = YAMLMap;
    exports.findPair = findPair;
  }
});

// node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS({
  "node_modules/yaml/dist/schema/common/map.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLMap = require_YAMLMap();
    var map = {
      collection: "map",
      default: true,
      nodeClass: YAMLMap.YAMLMap,
      tag: "tag:yaml.org,2002:map",
      resolve(map2, onError) {
        if (!identity.isMap(map2))
          onError("Expected a mapping for this tag");
        return map2;
      },
      createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
    };
    exports.map = map;
  }
});

// node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLSeq.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyCollection = require_stringifyCollection();
    var Collection = require_Collection();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var toJS = require_toJS();
    var YAMLSeq = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:seq";
      }
      constructor(schema) {
        super(identity.SEQ, schema);
        this.items = [];
      }
      add(value) {
        this.items.push(value);
      }
      /**
       * Removes a value from the collection.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       *
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return false;
        const del = this.items.splice(idx, 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return void 0;
        const it = this.items[idx];
        return !keepScalar && identity.isScalar(it) ? it.value : it;
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       */
      has(key) {
        const idx = asItemIndex(key);
        return typeof idx === "number" && idx < this.items.length;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       *
       * If `key` does not contain a representation of an integer, this will throw.
       * It may be wrapped in a `Scalar`.
       */
      set(key, value) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          throw new Error(`Expected a valid index, not ${key}.`);
        const prev = this.items[idx];
        if (identity.isScalar(prev) && Scalar.isScalarValue(value))
          prev.value = value;
        else
          this.items[idx] = value;
      }
      toJSON(_, ctx) {
        const seq = [];
        if (ctx?.onCreate)
          ctx.onCreate(seq);
        let i = 0;
        for (const item of this.items)
          seq.push(toJS.toJS(item, String(i++), ctx));
        return seq;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "- ",
          flowChars: { start: "[", end: "]" },
          itemIndent: (ctx.indent || "") + "  ",
          onChompKeep,
          onComment
        });
      }
      static from(schema, obj, ctx) {
        const { replacer } = ctx;
        const seq = new this(schema);
        if (obj && Symbol.iterator in Object(obj)) {
          let i = 0;
          for (let it of obj) {
            if (typeof replacer === "function") {
              const key = obj instanceof Set ? it : String(i++);
              it = replacer.call(obj, key, it);
            }
            seq.items.push(createNode.createNode(it, void 0, ctx));
          }
        }
        return seq;
      }
    };
    function asItemIndex(key) {
      let idx = identity.isScalar(key) ? key.value : key;
      if (idx && typeof idx === "string")
        idx = Number(idx);
      return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
    }
    exports.YAMLSeq = YAMLSeq;
  }
});

// node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS({
  "node_modules/yaml/dist/schema/common/seq.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLSeq = require_YAMLSeq();
    var seq = {
      collection: "seq",
      default: true,
      nodeClass: YAMLSeq.YAMLSeq,
      tag: "tag:yaml.org,2002:seq",
      resolve(seq2, onError) {
        if (!identity.isSeq(seq2))
          onError("Expected a sequence for this tag");
        return seq2;
      },
      createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
    };
    exports.seq = seq;
  }
});

// node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS({
  "node_modules/yaml/dist/schema/common/string.js"(exports) {
    "use strict";
    var stringifyString = require_stringifyString();
    var string = {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str) => str,
      stringify(item, ctx, onComment, onChompKeep) {
        ctx = Object.assign({ actualString: true }, ctx);
        return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
      }
    };
    exports.string = string;
  }
});

// node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS({
  "node_modules/yaml/dist/schema/common/null.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var nullTag = {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^(?:~|[Nn]ull|NULL)?$/,
      resolve: () => new Scalar.Scalar(null),
      stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
    };
    exports.nullTag = nullTag;
  }
});

// node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS({
  "node_modules/yaml/dist/schema/core/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var boolTag = {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
      resolve: (str) => new Scalar.Scalar(str[0] === "t" || str[0] === "T"),
      stringify({ source, value }, ctx) {
        if (source && boolTag.test.test(source)) {
          const sv = source[0] === "t" || source[0] === "T";
          if (value === sv)
            return source;
        }
        return value ? ctx.options.trueStr : ctx.options.falseStr;
      }
    };
    exports.boolTag = boolTag;
  }
});

// node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyNumber.js"(exports) {
    "use strict";
    function stringifyNumber({ format, minFractionDigits, tag, value }) {
      if (typeof value === "bigint")
        return String(value);
      const num = typeof value === "number" ? value : Number(value);
      if (!isFinite(num))
        return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
      let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
      if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
        let i = n.indexOf(".");
        if (i < 0) {
          i = n.length;
          n += ".";
        }
        let d = minFractionDigits - (n.length - i - 1);
        while (d-- > 0)
          n += "0";
      }
      return n;
    }
    exports.stringifyNumber = stringifyNumber;
  }
});

// node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS({
  "node_modules/yaml/dist/schema/core/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str));
        const dot = str.indexOf(".");
        if (dot !== -1 && str[str.length - 1] === "0")
          node.minFractionDigits = str.length - dot - 1;
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS({
  "node_modules/yaml/dist/schema/core/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value) && value >= 0)
        return prefix + value.toString(radix);
      return stringifyNumber.stringifyNumber(node);
    }
    var intOct = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^0o[0-7]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
      stringify: (node) => intStringify(node, 8, "0o")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^0x[0-9a-fA-F]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS({
  "node_modules/yaml/dist/schema/core/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.boolTag,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float
    ];
    exports.schema = schema;
  }
});

// node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS({
  "node_modules/yaml/dist/schema/json/schema.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var map = require_map();
    var seq = require_seq();
    function intIdentify(value) {
      return typeof value === "bigint" || Number.isInteger(value);
    }
    var stringifyJSON = ({ value }) => JSON.stringify(value);
    var jsonScalars = [
      {
        identify: (value) => typeof value === "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: (str) => str,
        stringify: stringifyJSON
      },
      {
        identify: (value) => value == null,
        createNode: () => new Scalar.Scalar(null),
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^null$/,
        resolve: () => null,
        stringify: stringifyJSON
      },
      {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^true$|^false$/,
        resolve: (str) => str === "true",
        stringify: stringifyJSON
      },
      {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
        stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
      },
      {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: (str) => parseFloat(str),
        stringify: stringifyJSON
      }
    ];
    var jsonError = {
      default: true,
      tag: "",
      test: /^/,
      resolve(str, onError) {
        onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
        return str;
      }
    };
    var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
    exports.schema = schema;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/binary.js"(exports) {
    "use strict";
    var node_buffer = __require("buffer");
    var Scalar = require_Scalar();
    var stringifyString = require_stringifyString();
    var binary = {
      identify: (value) => value instanceof Uint8Array,
      // Buffer inherits from Uint8Array
      default: false,
      tag: "tag:yaml.org,2002:binary",
      /**
       * Returns a Buffer in node and an Uint8Array in browsers
       *
       * To use the resulting buffer as an image, you'll want to do something like:
       *
       *   const blob = new Blob([buffer], { type: 'image/jpeg' })
       *   document.querySelector('#photo').src = URL.createObjectURL(blob)
       */
      resolve(src, onError) {
        if (typeof node_buffer.Buffer === "function") {
          return node_buffer.Buffer.from(src, "base64");
        } else if (typeof atob === "function") {
          const str = atob(src.replace(/[\n\r]/g, ""));
          const buffer = new Uint8Array(str.length);
          for (let i = 0; i < str.length; ++i)
            buffer[i] = str.charCodeAt(i);
          return buffer;
        } else {
          onError("This environment does not support reading binary tags; either Buffer or atob is required");
          return src;
        }
      },
      stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
        if (!value)
          return "";
        const buf = value;
        let str;
        if (typeof node_buffer.Buffer === "function") {
          str = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
        } else if (typeof btoa === "function") {
          let s = "";
          for (let i = 0; i < buf.length; ++i)
            s += String.fromCharCode(buf[i]);
          str = btoa(s);
        } else {
          throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
        }
        type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
        if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
          const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
          const n = Math.ceil(str.length / lineWidth);
          const lines = new Array(n);
          for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
            lines[i] = str.substr(o, lineWidth);
          }
          str = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
        }
        return stringifyString.stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
      }
    };
    exports.binary = binary;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/pairs.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLSeq = require_YAMLSeq();
    function resolvePairs(seq, onError) {
      if (identity.isSeq(seq)) {
        for (let i = 0; i < seq.items.length; ++i) {
          let item = seq.items[i];
          if (identity.isPair(item))
            continue;
          else if (identity.isMap(item)) {
            if (item.items.length > 1)
              onError("Each pair must have its own sequence indicator");
            const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
            if (item.commentBefore)
              pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
            if (item.comment) {
              const cn = pair.value ?? pair.key;
              cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
            }
            item = pair;
          }
          seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
        }
      } else
        onError("Expected a sequence for this tag");
      return seq;
    }
    function createPairs(schema, iterable, ctx) {
      const { replacer } = ctx;
      const pairs2 = new YAMLSeq.YAMLSeq(schema);
      pairs2.tag = "tag:yaml.org,2002:pairs";
      let i = 0;
      if (iterable && Symbol.iterator in Object(iterable))
        for (let it of iterable) {
          if (typeof replacer === "function")
            it = replacer.call(iterable, String(i++), it);
          let key, value;
          if (Array.isArray(it)) {
            if (it.length === 2) {
              key = it[0];
              value = it[1];
            } else
              throw new TypeError(`Expected [key, value] tuple: ${it}`);
          } else if (it && it instanceof Object) {
            const keys = Object.keys(it);
            if (keys.length === 1) {
              key = keys[0];
              value = it[key];
            } else {
              throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
            }
          } else {
            key = it;
          }
          pairs2.items.push(Pair.createPair(key, value, ctx));
        }
      return pairs2;
    }
    var pairs = {
      collection: "seq",
      default: false,
      tag: "tag:yaml.org,2002:pairs",
      resolve: resolvePairs,
      createNode: createPairs
    };
    exports.createPairs = createPairs;
    exports.pairs = pairs;
    exports.resolvePairs = resolvePairs;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/omap.js"(exports) {
    "use strict";
    var identity = require_identity();
    var toJS = require_toJS();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var pairs = require_pairs();
    var YAMLOMap = class _YAMLOMap extends YAMLSeq.YAMLSeq {
      constructor() {
        super();
        this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
        this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
        this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
        this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
        this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
        this.tag = _YAMLOMap.tag;
      }
      /**
       * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
       * but TypeScript won't allow widening the signature of a child method.
       */
      toJSON(_, ctx) {
        if (!ctx)
          return super.toJSON(_);
        const map = /* @__PURE__ */ new Map();
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const pair of this.items) {
          let key, value;
          if (identity.isPair(pair)) {
            key = toJS.toJS(pair.key, "", ctx);
            value = toJS.toJS(pair.value, key, ctx);
          } else {
            key = toJS.toJS(pair, "", ctx);
          }
          if (map.has(key))
            throw new Error("Ordered maps must not include duplicate keys");
          map.set(key, value);
        }
        return map;
      }
      static from(schema, iterable, ctx) {
        const pairs$1 = pairs.createPairs(schema, iterable, ctx);
        const omap2 = new this();
        omap2.items = pairs$1.items;
        return omap2;
      }
    };
    YAMLOMap.tag = "tag:yaml.org,2002:omap";
    var omap = {
      collection: "seq",
      identify: (value) => value instanceof Map,
      nodeClass: YAMLOMap,
      default: false,
      tag: "tag:yaml.org,2002:omap",
      resolve(seq, onError) {
        const pairs$1 = pairs.resolvePairs(seq, onError);
        const seenKeys = [];
        for (const { key } of pairs$1.items) {
          if (identity.isScalar(key)) {
            if (seenKeys.includes(key.value)) {
              onError(`Ordered maps must not include duplicate keys: ${key.value}`);
            } else {
              seenKeys.push(key.value);
            }
          }
        }
        return Object.assign(new YAMLOMap(), pairs$1);
      },
      createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
    };
    exports.YAMLOMap = YAMLOMap;
    exports.omap = omap;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function boolStringify({ value, source }, ctx) {
      const boolObj = value ? trueTag : falseTag;
      if (source && boolObj.test.test(source))
        return source;
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
    var trueTag = {
      identify: (value) => value === true,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
      resolve: () => new Scalar.Scalar(true),
      stringify: boolStringify
    };
    var falseTag = {
      identify: (value) => value === false,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
      resolve: () => new Scalar.Scalar(false),
      stringify: boolStringify
    };
    exports.falseTag = falseTag;
    exports.trueTag = trueTag;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str.replace(/_/g, "")),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str.replace(/_/g, "")));
        const dot = str.indexOf(".");
        if (dot !== -1) {
          const f = str.substring(dot + 1).replace(/_/g, "");
          if (f[f.length - 1] === "0")
            node.minFractionDigits = f.length;
        }
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    function intResolve(str, offset, radix, { intAsBigInt }) {
      const sign = str[0];
      if (sign === "-" || sign === "+")
        offset += 1;
      str = str.substring(offset).replace(/_/g, "");
      if (intAsBigInt) {
        switch (radix) {
          case 2:
            str = `0b${str}`;
            break;
          case 8:
            str = `0o${str}`;
            break;
          case 16:
            str = `0x${str}`;
            break;
        }
        const n2 = BigInt(str);
        return sign === "-" ? BigInt(-1) * n2 : n2;
      }
      const n = parseInt(str, radix);
      return sign === "-" ? -1 * n : n;
    }
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value)) {
        const str = value.toString(radix);
        return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
      }
      return stringifyNumber.stringifyNumber(node);
    }
    var intBin = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "BIN",
      test: /^[-+]?0b[0-1_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
      stringify: (node) => intStringify(node, 2, "0b")
    };
    var intOct = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^[-+]?0[0-7_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
      stringify: (node) => intStringify(node, 8, "0")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9][0-9_]*$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^[-+]?0x[0-9a-fA-F_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int;
    exports.intBin = intBin;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/set.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSet = class _YAMLSet extends YAMLMap.YAMLMap {
      constructor(schema) {
        super(schema);
        this.tag = _YAMLSet.tag;
      }
      add(key) {
        let pair;
        if (identity.isPair(key))
          pair = key;
        else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
          pair = new Pair.Pair(key.key, null);
        else
          pair = new Pair.Pair(key, null);
        const prev = YAMLMap.findPair(this.items, pair.key);
        if (!prev)
          this.items.push(pair);
      }
      /**
       * If `keepPair` is `true`, returns the Pair matching `key`.
       * Otherwise, returns the value of that Pair's key.
       */
      get(key, keepPair) {
        const pair = YAMLMap.findPair(this.items, key);
        return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
      }
      set(key, value) {
        if (typeof value !== "boolean")
          throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
        const prev = YAMLMap.findPair(this.items, key);
        if (prev && !value) {
          this.items.splice(this.items.indexOf(prev), 1);
        } else if (!prev && value) {
          this.items.push(new Pair.Pair(key));
        }
      }
      toJSON(_, ctx) {
        return super.toJSON(_, ctx, Set);
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        if (this.hasAllNullValues(true))
          return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
        else
          throw new Error("Set items must all have null values");
      }
      static from(schema, iterable, ctx) {
        const { replacer } = ctx;
        const set2 = new this(schema);
        if (iterable && Symbol.iterator in Object(iterable))
          for (let value of iterable) {
            if (typeof replacer === "function")
              value = replacer.call(iterable, value, value);
            set2.items.push(Pair.createPair(value, null, ctx));
          }
        return set2;
      }
    };
    YAMLSet.tag = "tag:yaml.org,2002:set";
    var set = {
      collection: "map",
      identify: (value) => value instanceof Set,
      nodeClass: YAMLSet,
      default: false,
      tag: "tag:yaml.org,2002:set",
      createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
      resolve(map, onError) {
        if (identity.isMap(map)) {
          if (map.hasAllNullValues(true))
            return Object.assign(new YAMLSet(), map);
          else
            onError("Set items must all have null values");
        } else
          onError("Expected a mapping for this tag");
        return map;
      }
    };
    exports.YAMLSet = YAMLSet;
    exports.set = set;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/timestamp.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    function parseSexagesimal(str, asBigInt) {
      const sign = str[0];
      const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
      const num = (n) => asBigInt ? BigInt(n) : Number(n);
      const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num(60) + num(p), num(0));
      return sign === "-" ? num(-1) * res : res;
    }
    function stringifySexagesimal(node) {
      let { value } = node;
      let num = (n) => n;
      if (typeof value === "bigint")
        num = (n) => BigInt(n);
      else if (isNaN(value) || !isFinite(value))
        return stringifyNumber.stringifyNumber(node);
      let sign = "";
      if (value < 0) {
        sign = "-";
        value *= num(-1);
      }
      const _60 = num(60);
      const parts = [value % _60];
      if (value < 60) {
        parts.unshift(0);
      } else {
        value = (value - parts[0]) / _60;
        parts.unshift(value % _60);
        if (value >= 60) {
          value = (value - parts[0]) / _60;
          parts.unshift(value);
        }
      }
      return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
    }
    var intTime = {
      identify: (value) => typeof value === "bigint" || Number.isInteger(value),
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
      resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
      stringify: stringifySexagesimal
    };
    var floatTime = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
      resolve: (str) => parseSexagesimal(str, false),
      stringify: stringifySexagesimal
    };
    var timestamp = {
      identify: (value) => value instanceof Date,
      default: true,
      tag: "tag:yaml.org,2002:timestamp",
      // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
      // may be omitted altogether, resulting in a date format. In such a case, the time part is
      // assumed to be 00:00:00Z (start of day, UTC).
      test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
      resolve(str) {
        const match = str.match(timestamp.test);
        if (!match)
          throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
        const [, year, month, day, hour, minute, second] = match.map(Number);
        const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
        let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
        const tz = match[8];
        if (tz && tz !== "Z") {
          let d = parseSexagesimal(tz, false);
          if (Math.abs(d) < 30)
            d *= 60;
          date -= 6e4 * d;
        }
        return new Date(date);
      },
      stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
    };
    exports.floatTime = floatTime;
    exports.intTime = intTime;
    exports.timestamp = timestamp;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var binary = require_binary();
    var bool = require_bool2();
    var float = require_float2();
    var int = require_int2();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var set = require_set();
    var timestamp = require_timestamp();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.trueTag,
      bool.falseTag,
      int.intBin,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float,
      binary.binary,
      merge.merge,
      omap.omap,
      pairs.pairs,
      set.set,
      timestamp.intTime,
      timestamp.floatTime,
      timestamp.timestamp
    ];
    exports.schema = schema;
  }
});

// node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS({
  "node_modules/yaml/dist/schema/tags.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = require_schema();
    var schema$1 = require_schema2();
    var binary = require_binary();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var schema$2 = require_schema3();
    var set = require_set();
    var timestamp = require_timestamp();
    var schemas2 = /* @__PURE__ */ new Map([
      ["core", schema.schema],
      ["failsafe", [map.map, seq.seq, string.string]],
      ["json", schema$1.schema],
      ["yaml11", schema$2.schema],
      ["yaml-1.1", schema$2.schema]
    ]);
    var tagsByName = {
      binary: binary.binary,
      bool: bool.boolTag,
      float: float.float,
      floatExp: float.floatExp,
      floatNaN: float.floatNaN,
      floatTime: timestamp.floatTime,
      int: int.int,
      intHex: int.intHex,
      intOct: int.intOct,
      intTime: timestamp.intTime,
      map: map.map,
      merge: merge.merge,
      null: _null.nullTag,
      omap: omap.omap,
      pairs: pairs.pairs,
      seq: seq.seq,
      set: set.set,
      timestamp: timestamp.timestamp
    };
    var coreKnownTags = {
      "tag:yaml.org,2002:binary": binary.binary,
      "tag:yaml.org,2002:merge": merge.merge,
      "tag:yaml.org,2002:omap": omap.omap,
      "tag:yaml.org,2002:pairs": pairs.pairs,
      "tag:yaml.org,2002:set": set.set,
      "tag:yaml.org,2002:timestamp": timestamp.timestamp
    };
    function getTags(customTags, schemaName, addMergeTag) {
      const schemaTags = schemas2.get(schemaName);
      if (schemaTags && !customTags) {
        return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
      }
      let tags = schemaTags;
      if (!tags) {
        if (Array.isArray(customTags))
          tags = [];
        else {
          const keys = Array.from(schemas2.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
        }
      }
      if (Array.isArray(customTags)) {
        for (const tag of customTags)
          tags = tags.concat(tag);
      } else if (typeof customTags === "function") {
        tags = customTags(tags.slice());
      }
      if (addMergeTag)
        tags = tags.concat(merge.merge);
      return tags.reduce((tags2, tag) => {
        const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
        if (!tagObj) {
          const tagName = JSON.stringify(tag);
          const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
        }
        if (!tags2.includes(tagObj))
          tags2.push(tagObj);
        return tags2;
      }, []);
    }
    exports.coreKnownTags = coreKnownTags;
    exports.getTags = getTags;
  }
});

// node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS({
  "node_modules/yaml/dist/schema/Schema.js"(exports) {
    "use strict";
    var identity = require_identity();
    var map = require_map();
    var seq = require_seq();
    var string = require_string();
    var tags = require_tags();
    var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    var Schema = class _Schema {
      constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
        this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
        this.name = typeof schema === "string" && schema || "core";
        this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
        this.tags = tags.getTags(customTags, this.name, merge);
        this.toStringOptions = toStringDefaults ?? null;
        Object.defineProperty(this, identity.MAP, { value: map.map });
        Object.defineProperty(this, identity.SCALAR, { value: string.string });
        Object.defineProperty(this, identity.SEQ, { value: seq.seq });
        this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
      }
      clone() {
        const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
        copy.tags = this.tags.slice();
        return copy;
      }
    };
    exports.Schema = Schema;
  }
});

// node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyDocument.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify3 = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyDocument(doc, options) {
      const lines = [];
      let hasDirectives = options.directives === true;
      if (options.directives !== false && doc.directives) {
        const dir = doc.directives.toString(doc);
        if (dir) {
          lines.push(dir);
          hasDirectives = true;
        } else if (doc.directives.docStart)
          hasDirectives = true;
      }
      if (hasDirectives)
        lines.push("---");
      const ctx = stringify3.createStringifyContext(doc, options);
      const { commentString } = ctx.options;
      if (doc.commentBefore) {
        if (lines.length !== 1)
          lines.unshift("");
        const cs = commentString(doc.commentBefore);
        lines.unshift(stringifyComment.indentComment(cs, ""));
      }
      let chompKeep = false;
      let contentComment = null;
      if (doc.contents) {
        if (identity.isNode(doc.contents)) {
          if (doc.contents.spaceBefore && hasDirectives)
            lines.push("");
          if (doc.contents.commentBefore) {
            const cs = commentString(doc.contents.commentBefore);
            lines.push(stringifyComment.indentComment(cs, ""));
          }
          ctx.forceBlockIndent = !!doc.comment;
          contentComment = doc.contents.comment;
        }
        const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
        let body = stringify3.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
        if (contentComment)
          body += stringifyComment.lineComment(body, "", commentString(contentComment));
        if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
          lines[lines.length - 1] = `--- ${body}`;
        } else
          lines.push(body);
      } else {
        lines.push(stringify3.stringify(doc.contents, ctx));
      }
      if (doc.directives?.docEnd) {
        if (doc.comment) {
          const cs = commentString(doc.comment);
          if (cs.includes("\n")) {
            lines.push("...");
            lines.push(stringifyComment.indentComment(cs, ""));
          } else {
            lines.push(`... ${cs}`);
          }
        } else {
          lines.push("...");
        }
      } else {
        let dc = doc.comment;
        if (dc && chompKeep)
          dc = dc.replace(/^\n+/, "");
        if (dc) {
          if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
            lines.push("");
          lines.push(stringifyComment.indentComment(commentString(dc), ""));
        }
      }
      return lines.join("\n") + "\n";
    }
    exports.stringifyDocument = stringifyDocument;
  }
});

// node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS({
  "node_modules/yaml/dist/doc/Document.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var toJS = require_toJS();
    var Schema = require_Schema();
    var stringifyDocument = require_stringifyDocument();
    var anchors = require_anchors();
    var applyReviver = require_applyReviver();
    var createNode = require_createNode();
    var directives = require_directives();
    var Document = class _Document {
      constructor(value, replacer, options) {
        this.commentBefore = null;
        this.comment = null;
        this.errors = [];
        this.warnings = [];
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
        let _replacer = null;
        if (typeof replacer === "function" || Array.isArray(replacer)) {
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const opt = Object.assign({
          intAsBigInt: false,
          keepSourceTokens: false,
          logLevel: "warn",
          prettyErrors: true,
          strict: true,
          stringKeys: false,
          uniqueKeys: true,
          version: "1.2"
        }, options);
        this.options = opt;
        let { version } = opt;
        if (options?._directives) {
          this.directives = options._directives.atDocument();
          if (this.directives.yaml.explicit)
            version = this.directives.yaml.version;
        } else
          this.directives = new directives.Directives({ version });
        this.setSchema(version, options);
        this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
      }
      /**
       * Create a deep copy of this Document and its contents.
       *
       * Custom Node values that inherit from `Object` still refer to their original instances.
       */
      clone() {
        const copy = Object.create(_Document.prototype, {
          [identity.NODE_TYPE]: { value: identity.DOC }
        });
        copy.commentBefore = this.commentBefore;
        copy.comment = this.comment;
        copy.errors = this.errors.slice();
        copy.warnings = this.warnings.slice();
        copy.options = Object.assign({}, this.options);
        if (this.directives)
          copy.directives = this.directives.clone();
        copy.schema = this.schema.clone();
        copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** Adds a value to the document. */
      add(value) {
        if (assertCollection(this.contents))
          this.contents.add(value);
      }
      /** Adds a value to the document. */
      addIn(path, value) {
        if (assertCollection(this.contents))
          this.contents.addIn(path, value);
      }
      /**
       * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
       *
       * If `node` already has an anchor, `name` is ignored.
       * Otherwise, the `node.anchor` value will be set to `name`,
       * or if an anchor with that name is already present in the document,
       * `name` will be used as a prefix for a new unique anchor.
       * If `name` is undefined, the generated anchor will use 'a' as a prefix.
       */
      createAlias(node, name) {
        if (!node.anchor) {
          const prev = anchors.anchorNames(this);
          node.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
        }
        return new Alias.Alias(node.anchor);
      }
      createNode(value, replacer, options) {
        let _replacer = void 0;
        if (typeof replacer === "function") {
          value = replacer.call({ "": value }, "", value);
          _replacer = replacer;
        } else if (Array.isArray(replacer)) {
          const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
          const asStr = replacer.filter(keyToStr).map(String);
          if (asStr.length > 0)
            replacer = replacer.concat(asStr);
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
        const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(
          this,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          anchorPrefix || "a"
        );
        const ctx = {
          aliasDuplicateObjects: aliasDuplicateObjects ?? true,
          keepUndefined: keepUndefined ?? false,
          onAnchor,
          onTagObj,
          replacer: _replacer,
          schema: this.schema,
          sourceObjects
        };
        const node = createNode.createNode(value, tag, ctx);
        if (flow && identity.isCollection(node))
          node.flow = true;
        setAnchors();
        return node;
      }
      /**
       * Convert a key and a value into a `Pair` using the current schema,
       * recursively wrapping all values as `Scalar` or `Collection` nodes.
       */
      createPair(key, value, options = {}) {
        const k = this.createNode(key, null, options);
        const v = this.createNode(value, null, options);
        return new Pair.Pair(k, v);
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        return assertCollection(this.contents) ? this.contents.delete(key) : false;
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path) {
        if (Collection.isEmptyPath(path)) {
          if (this.contents == null)
            return false;
          this.contents = null;
          return true;
        }
        return assertCollection(this.contents) ? this.contents.deleteIn(path) : false;
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      get(key, keepScalar) {
        return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
      }
      /**
       * Returns item at `path`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path, keepScalar) {
        if (Collection.isEmptyPath(path))
          return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
        return identity.isCollection(this.contents) ? this.contents.getIn(path, keepScalar) : void 0;
      }
      /**
       * Checks if the document includes a value with the key `key`.
       */
      has(key) {
        return identity.isCollection(this.contents) ? this.contents.has(key) : false;
      }
      /**
       * Checks if the document includes a value at `path`.
       */
      hasIn(path) {
        if (Collection.isEmptyPath(path))
          return this.contents !== void 0;
        return identity.isCollection(this.contents) ? this.contents.hasIn(path) : false;
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      set(key, value) {
        if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, [key], value);
        } else if (assertCollection(this.contents)) {
          this.contents.set(key, value);
        }
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path, value) {
        if (Collection.isEmptyPath(path)) {
          this.contents = value;
        } else if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, Array.from(path), value);
        } else if (assertCollection(this.contents)) {
          this.contents.setIn(path, value);
        }
      }
      /**
       * Change the YAML version and schema used by the document.
       * A `null` version disables support for directives, explicit tags, anchors, and aliases.
       * It also requires the `schema` option to be given as a `Schema` instance value.
       *
       * Overrides all previously set schema options.
       */
      setSchema(version, options = {}) {
        if (typeof version === "number")
          version = String(version);
        let opt;
        switch (version) {
          case "1.1":
            if (this.directives)
              this.directives.yaml.version = "1.1";
            else
              this.directives = new directives.Directives({ version: "1.1" });
            opt = { resolveKnownTags: false, schema: "yaml-1.1" };
            break;
          case "1.2":
          case "next":
            if (this.directives)
              this.directives.yaml.version = version;
            else
              this.directives = new directives.Directives({ version });
            opt = { resolveKnownTags: true, schema: "core" };
            break;
          case null:
            if (this.directives)
              delete this.directives;
            opt = null;
            break;
          default: {
            const sv = JSON.stringify(version);
            throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
          }
        }
        if (options.schema instanceof Object)
          this.schema = options.schema;
        else if (opt)
          this.schema = new Schema.Schema(Object.assign(opt, options));
        else
          throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
      }
      // json & jsonArg are only used from toJSON()
      toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc: this,
          keep: !json,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
      /**
       * A JSON representation of the document `contents`.
       *
       * @param jsonArg Used by `JSON.stringify` to indicate the array index or
       *   property name.
       */
      toJSON(jsonArg, onAnchor) {
        return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
      }
      /** A YAML representation of the document. */
      toString(options = {}) {
        if (this.errors.length > 0)
          throw new Error("Document with errors cannot be stringified");
        if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
          const s = JSON.stringify(options.indent);
          throw new Error(`"indent" option must be a positive integer, not ${s}`);
        }
        return stringifyDocument.stringifyDocument(this, options);
      }
    };
    function assertCollection(contents) {
      if (identity.isCollection(contents))
        return true;
      throw new Error("Expected a YAML collection as document contents");
    }
    exports.Document = Document;
  }
});

// node_modules/yaml/dist/errors.js
var require_errors = __commonJS({
  "node_modules/yaml/dist/errors.js"(exports) {
    "use strict";
    var YAMLError = class extends Error {
      constructor(name, pos, code, message) {
        super();
        this.name = name;
        this.code = code;
        this.message = message;
        this.pos = pos;
      }
    };
    var YAMLParseError = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLParseError", pos, code, message);
      }
    };
    var YAMLWarning = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLWarning", pos, code, message);
      }
    };
    var prettifyError = (src, lc) => (error) => {
      if (error.pos[0] === -1)
        return;
      error.linePos = error.pos.map((pos) => lc.linePos(pos));
      const { line, col } = error.linePos[0];
      error.message += ` at line ${line}, column ${col}`;
      let ci = col - 1;
      let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
      if (ci >= 60 && lineStr.length > 80) {
        const trimStart = Math.min(ci - 39, lineStr.length - 79);
        lineStr = "\u2026" + lineStr.substring(trimStart);
        ci -= trimStart - 1;
      }
      if (lineStr.length > 80)
        lineStr = lineStr.substring(0, 79) + "\u2026";
      if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
        let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
        if (prev.length > 80)
          prev = prev.substring(0, 79) + "\u2026\n";
        lineStr = prev + lineStr;
      }
      if (/[^ ]/.test(lineStr)) {
        let count = 1;
        const end = error.linePos[1];
        if (end?.line === line && end.col > col) {
          count = Math.max(1, Math.min(end.col - col, 80 - ci));
        }
        const pointer = " ".repeat(ci) + "^".repeat(count);
        error.message += `:

${lineStr}
${pointer}
`;
      }
    };
    exports.YAMLError = YAMLError;
    exports.YAMLParseError = YAMLParseError;
    exports.YAMLWarning = YAMLWarning;
    exports.prettifyError = prettifyError;
  }
});

// node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS({
  "node_modules/yaml/dist/compose/resolve-props.js"(exports) {
    "use strict";
    function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
      let spaceBefore = false;
      let atNewline = startOnNewline;
      let hasSpace = startOnNewline;
      let comment = "";
      let commentSep = "";
      let hasNewline = false;
      let reqSpace = false;
      let tab = null;
      let anchor = null;
      let tag = null;
      let newlineAfterProp = null;
      let comma = null;
      let found = null;
      let start = null;
      for (const token of tokens) {
        if (reqSpace) {
          if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
            onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
          reqSpace = false;
        }
        if (tab) {
          if (atNewline && token.type !== "comment" && token.type !== "newline") {
            onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
          }
          tab = null;
        }
        switch (token.type) {
          case "space":
            if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) {
              tab = token;
            }
            hasSpace = true;
            break;
          case "comment": {
            if (!hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = token.source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += commentSep + cb;
            commentSep = "";
            atNewline = false;
            break;
          }
          case "newline":
            if (atNewline) {
              if (comment)
                comment += token.source;
              else if (!found || indicator !== "seq-item-ind")
                spaceBefore = true;
            } else
              commentSep += token.source;
            atNewline = true;
            hasNewline = true;
            if (anchor || tag)
              newlineAfterProp = token;
            hasSpace = true;
            break;
          case "anchor":
            if (anchor)
              onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
            if (token.source.endsWith(":"))
              onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
            anchor = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          case "tag": {
            if (tag)
              onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
            tag = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          }
          case indicator:
            if (anchor || tag)
              onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
            if (found)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
            found = token;
            atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
            hasSpace = false;
            break;
          case "comma":
            if (flow) {
              if (comma)
                onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
              comma = token;
              atNewline = false;
              hasSpace = false;
              break;
            }
          // else fallthrough
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
            atNewline = false;
            hasSpace = false;
        }
      }
      const last = tokens[tokens.length - 1];
      const end = last ? last.offset + last.source.length : offset;
      if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
        onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
      }
      if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
        onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
      return {
        comma,
        found,
        spaceBefore,
        comment,
        hasNewline,
        anchor,
        tag,
        newlineAfterProp,
        end,
        start: start ?? end
      };
    }
    exports.resolveProps = resolveProps;
  }
});

// node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS({
  "node_modules/yaml/dist/compose/util-contains-newline.js"(exports) {
    "use strict";
    function containsNewline(key) {
      if (!key)
        return null;
      switch (key.type) {
        case "alias":
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          if (key.source.includes("\n"))
            return true;
          if (key.end) {
            for (const st of key.end)
              if (st.type === "newline")
                return true;
          }
          return false;
        case "flow-collection":
          for (const it of key.items) {
            for (const st of it.start)
              if (st.type === "newline")
                return true;
            if (it.sep) {
              for (const st of it.sep)
                if (st.type === "newline")
                  return true;
            }
            if (containsNewline(it.key) || containsNewline(it.value))
              return true;
          }
          return false;
        default:
          return true;
      }
    }
    exports.containsNewline = containsNewline;
  }
});

// node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS({
  "node_modules/yaml/dist/compose/util-flow-indent-check.js"(exports) {
    "use strict";
    var utilContainsNewline = require_util_contains_newline();
    function flowIndentCheck(indent, fc, onError) {
      if (fc?.type === "flow-collection") {
        const end = fc.end[0];
        if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
          const msg = "Flow end indicator should be more indented than parent";
          onError(end, "BAD_INDENT", msg, true);
        }
      }
    }
    exports.flowIndentCheck = flowIndentCheck;
  }
});

// node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS({
  "node_modules/yaml/dist/compose/util-map-includes.js"(exports) {
    "use strict";
    var identity = require_identity();
    function mapIncludes(ctx, items, search) {
      const { uniqueKeys } = ctx.options;
      if (uniqueKeys === false)
        return false;
      const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value;
      return items.some((pair) => isEqual(pair.key, search));
    }
    exports.mapIncludes = mapIncludes;
  }
});

// node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-map.js"(exports) {
    "use strict";
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    var utilMapIncludes = require_util_map_includes();
    var startColMsg = "All mapping items must start at the same column";
    function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
      const map = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      let offset = bm.offset;
      let commentEnd = null;
      for (const collItem of bm.items) {
        const { start, key, sep: sep11, value } = collItem;
        const keyProps = resolveProps.resolveProps(start, {
          indicator: "explicit-key-ind",
          next: key ?? sep11?.[0],
          offset,
          onError,
          parentIndent: bm.indent,
          startOnNewline: true
        });
        const implicitKey = !keyProps.found;
        if (implicitKey) {
          if (key) {
            if (key.type === "block-seq")
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
            else if ("indent" in key && key.indent !== bm.indent)
              onError(offset, "BAD_INDENT", startColMsg);
          }
          if (!keyProps.anchor && !keyProps.tag && !sep11) {
            commentEnd = keyProps.end;
            if (keyProps.comment) {
              if (map.comment)
                map.comment += "\n" + keyProps.comment;
              else
                map.comment = keyProps.comment;
            }
            continue;
          }
          if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
            onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
          }
        } else if (keyProps.found?.indent !== bm.indent) {
          onError(offset, "BAD_INDENT", startColMsg);
        }
        ctx.atKey = true;
        const keyStart = keyProps.end;
        const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
        ctx.atKey = false;
        if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
          onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
        const valueProps = resolveProps.resolveProps(sep11 ?? [], {
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: bm.indent,
          startOnNewline: !key || key.type === "block-scalar"
        });
        offset = valueProps.end;
        if (valueProps.found) {
          if (implicitKey) {
            if (value?.type === "block-map" && !valueProps.hasNewline)
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
            if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
              onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep11, null, valueProps, onError);
          if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
          offset = valueNode.range[2];
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        } else {
          if (implicitKey)
            onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
          if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        }
      }
      if (commentEnd && commentEnd < offset)
        onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
      map.range = [bm.offset, offset, commentEnd ?? offset];
      return map;
    }
    exports.resolveBlockMap = resolveBlockMap;
  }
});

// node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-seq.js"(exports) {
    "use strict";
    var YAMLSeq = require_YAMLSeq();
    var resolveProps = require_resolve_props();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
      const seq = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = bs.offset;
      let commentEnd = null;
      for (const { start, value } of bs.items) {
        const props = resolveProps.resolveProps(start, {
          indicator: "seq-item-ind",
          next: value,
          offset,
          onError,
          parentIndent: bs.indent,
          startOnNewline: true
        });
        if (!props.found) {
          if (props.anchor || props.tag || value) {
            if (value?.type === "block-seq")
              onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
            else
              onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
          } else {
            commentEnd = props.end;
            if (props.comment)
              seq.comment = props.comment;
            continue;
          }
        }
        const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
        offset = node.range[2];
        seq.items.push(node);
      }
      seq.range = [bs.offset, offset, commentEnd ?? offset];
      return seq;
    }
    exports.resolveBlockSeq = resolveBlockSeq;
  }
});

// node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS({
  "node_modules/yaml/dist/compose/resolve-end.js"(exports) {
    "use strict";
    function resolveEnd(end, offset, reqSpace, onError) {
      let comment = "";
      if (end) {
        let hasSpace = false;
        let sep11 = "";
        for (const token of end) {
          const { source, type } = token;
          switch (type) {
            case "space":
              hasSpace = true;
              break;
            case "comment": {
              if (reqSpace && !hasSpace)
                onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
              const cb = source.substring(1) || " ";
              if (!comment)
                comment = cb;
              else
                comment += sep11 + cb;
              sep11 = "";
              break;
            }
            case "newline":
              if (comment)
                sep11 += source;
              hasSpace = true;
              break;
            default:
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
          }
          offset += source.length;
        }
      }
      return { comment, offset };
    }
    exports.resolveEnd = resolveEnd;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilMapIncludes = require_util_map_includes();
    var blockMsg = "Block collections are not allowed within flow collections";
    var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
    function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
      const isMap = fc.start.source === "{";
      const fcName = isMap ? "flow map" : "flow sequence";
      const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
      const coll = new NodeClass(ctx.schema);
      coll.flow = true;
      const atRoot = ctx.atRoot;
      if (atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = fc.offset + fc.start.source.length;
      for (let i = 0; i < fc.items.length; ++i) {
        const collItem = fc.items[i];
        const { start, key, sep: sep11, value } = collItem;
        const props = resolveProps.resolveProps(start, {
          flow: fcName,
          indicator: "explicit-key-ind",
          next: key ?? sep11?.[0],
          offset,
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (!props.found) {
          if (!props.anchor && !props.tag && !sep11 && !value) {
            if (i === 0 && props.comma)
              onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
            else if (i < fc.items.length - 1)
              onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
            if (props.comment) {
              if (coll.comment)
                coll.comment += "\n" + props.comment;
              else
                coll.comment = props.comment;
            }
            offset = props.end;
            continue;
          }
          if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
            onError(
              key,
              // checked by containsNewline()
              "MULTILINE_IMPLICIT_KEY",
              "Implicit keys of flow sequence pairs need to be on a single line"
            );
        }
        if (i === 0) {
          if (props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
        } else {
          if (!props.comma)
            onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
          if (props.comment) {
            let prevItemComment = "";
            loop: for (const st of start) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
            if (prevItemComment) {
              let prev = coll.items[coll.items.length - 1];
              if (identity.isPair(prev))
                prev = prev.value ?? prev.key;
              if (prev.comment)
                prev.comment += "\n" + prevItemComment;
              else
                prev.comment = prevItemComment;
              props.comment = props.comment.substring(prevItemComment.length + 1);
            }
          }
        }
        if (!isMap && !sep11 && !props.found) {
          const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep11, null, props, onError);
          coll.items.push(valueNode);
          offset = valueNode.range[2];
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else {
          ctx.atKey = true;
          const keyStart = props.end;
          const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
          if (isBlock(key))
            onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
          ctx.atKey = false;
          const valueProps = resolveProps.resolveProps(sep11 ?? [], {
            flow: fcName,
            indicator: "map-value-ind",
            next: value,
            offset: keyNode.range[2],
            onError,
            parentIndent: fc.indent,
            startOnNewline: false
          });
          if (valueProps.found) {
            if (!isMap && !props.found && ctx.options.strict) {
              if (sep11)
                for (const st of sep11) {
                  if (st === valueProps.found)
                    break;
                  if (st.type === "newline") {
                    onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                    break;
                  }
                }
              if (props.start < valueProps.found.offset - 1024)
                onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
            }
          } else if (value) {
            if ("source" in value && value.source?.[0] === ":")
              onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
            else
              onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep11, null, valueProps, onError) : null;
          if (valueNode) {
            if (isBlock(value))
              onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
          } else if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          if (isMap) {
            const map = coll;
            if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
              onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
            map.items.push(pair);
          } else {
            const map = new YAMLMap.YAMLMap(ctx.schema);
            map.flow = true;
            map.items.push(pair);
            const endRange = (valueNode ?? keyNode).range;
            map.range = [keyNode.range[0], endRange[1], endRange[2]];
            coll.items.push(map);
          }
          offset = valueNode ? valueNode.range[2] : valueProps.end;
        }
      }
      const expectedEnd = isMap ? "}" : "]";
      const [ce, ...ee] = fc.end;
      let cePos = offset;
      if (ce?.source === expectedEnd)
        cePos = ce.offset + ce.source.length;
      else {
        const name = fcName[0].toUpperCase() + fcName.substring(1);
        const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
        onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
        if (ce && ce.source.length !== 1)
          ee.unshift(ce);
      }
      if (ee.length > 0) {
        const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
        if (end.comment) {
          if (coll.comment)
            coll.comment += "\n" + end.comment;
          else
            coll.comment = end.comment;
        }
        coll.range = [fc.offset, cePos, end.offset];
      } else {
        coll.range = [fc.offset, cePos, cePos];
      }
      return coll;
    }
    exports.resolveFlowCollection = resolveFlowCollection;
  }
});

// node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS({
  "node_modules/yaml/dist/compose/compose-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveBlockMap = require_resolve_block_map();
    var resolveBlockSeq = require_resolve_block_seq();
    var resolveFlowCollection = require_resolve_flow_collection();
    function resolveCollection(CN, ctx, token, onError, tagName, tag) {
      const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
      const Coll = coll.constructor;
      if (tagName === "!" || tagName === Coll.tagName) {
        coll.tag = Coll.tagName;
        return coll;
      }
      if (tagName)
        coll.tag = tagName;
      return coll;
    }
    function composeCollection(CN, ctx, token, props, onError) {
      const tagToken = props.tag;
      const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
      if (token.type === "block-seq") {
        const { anchor, newlineAfterProp: nl } = props;
        const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
        if (lastProp && (!nl || nl.offset < lastProp.offset)) {
          const message = "Missing newline after block sequence props";
          onError(lastProp, "MISSING_CHAR", message);
        }
      }
      const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
      if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
      let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
      if (!tag) {
        const kt = ctx.schema.knownTags[tagName];
        if (kt?.collection === expType) {
          ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
          tag = kt;
        } else {
          if (kt) {
            onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
          } else {
            onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
          }
          return resolveCollection(CN, ctx, token, onError, tagName);
        }
      }
      const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
      const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
      const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
      node.range = coll.range;
      node.tag = tagName;
      if (tag?.format)
        node.format = tag.format;
      return node;
    }
    exports.composeCollection = composeCollection;
  }
});

// node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function resolveBlockScalar(ctx, scalar, onError) {
      const start = scalar.offset;
      const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
      if (!header)
        return { value: "", type: null, comment: "", range: [start, start, start] };
      const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
      const lines = scalar.source ? splitLines(scalar.source) : [];
      let chompStart = lines.length;
      for (let i = lines.length - 1; i >= 0; --i) {
        const content = lines[i][1];
        if (content === "" || content === "\r")
          chompStart = i;
        else
          break;
      }
      if (chompStart === 0) {
        const value2 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
        let end2 = start + header.length;
        if (scalar.source)
          end2 += scalar.source.length;
        return { value: value2, type, comment: header.comment, range: [start, end2, end2] };
      }
      let trimIndent = scalar.indent + header.indent;
      let offset = scalar.offset + header.length;
      let contentStart = 0;
      for (let i = 0; i < chompStart; ++i) {
        const [indent, content] = lines[i];
        if (content === "" || content === "\r") {
          if (header.indent === 0 && indent.length > trimIndent)
            trimIndent = indent.length;
        } else {
          if (indent.length < trimIndent) {
            const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
            onError(offset + indent.length, "MISSING_CHAR", message);
          }
          if (header.indent === 0)
            trimIndent = indent.length;
          contentStart = i;
          if (trimIndent === 0 && !ctx.atRoot) {
            const message = "Block scalar values in collections must be indented";
            onError(offset, "BAD_INDENT", message);
          }
          break;
        }
        offset += indent.length + content.length + 1;
      }
      for (let i = lines.length - 1; i >= chompStart; --i) {
        if (lines[i][0].length > trimIndent)
          chompStart = i + 1;
      }
      let value = "";
      let sep11 = "";
      let prevMoreIndented = false;
      for (let i = 0; i < contentStart; ++i)
        value += lines[i][0].slice(trimIndent) + "\n";
      for (let i = contentStart; i < chompStart; ++i) {
        let [indent, content] = lines[i];
        offset += indent.length + content.length + 1;
        const crlf = content[content.length - 1] === "\r";
        if (crlf)
          content = content.slice(0, -1);
        if (content && indent.length < trimIndent) {
          const src = header.indent ? "explicit indentation indicator" : "first line";
          const message = `Block scalar lines must not be less indented than their ${src}`;
          onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
          indent = "";
        }
        if (type === Scalar.Scalar.BLOCK_LITERAL) {
          value += sep11 + indent.slice(trimIndent) + content;
          sep11 = "\n";
        } else if (indent.length > trimIndent || content[0] === "	") {
          if (sep11 === " ")
            sep11 = "\n";
          else if (!prevMoreIndented && sep11 === "\n")
            sep11 = "\n\n";
          value += sep11 + indent.slice(trimIndent) + content;
          sep11 = "\n";
          prevMoreIndented = true;
        } else if (content === "") {
          if (sep11 === "\n")
            value += "\n";
          else
            sep11 = "\n";
        } else {
          value += sep11 + content;
          sep11 = " ";
          prevMoreIndented = false;
        }
      }
      switch (header.chomp) {
        case "-":
          break;
        case "+":
          for (let i = chompStart; i < lines.length; ++i)
            value += "\n" + lines[i][0].slice(trimIndent);
          if (value[value.length - 1] !== "\n")
            value += "\n";
          break;
        default:
          value += "\n";
      }
      const end = start + header.length + scalar.source.length;
      return { value, type, comment: header.comment, range: [start, end, end] };
    }
    function parseBlockScalarHeader({ offset, props }, strict, onError) {
      if (props[0].type !== "block-scalar-header") {
        onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
        return null;
      }
      const { source } = props[0];
      const mode = source[0];
      let indent = 0;
      let chomp = "";
      let error = -1;
      for (let i = 1; i < source.length; ++i) {
        const ch = source[i];
        if (!chomp && (ch === "-" || ch === "+"))
          chomp = ch;
        else {
          const n = Number(ch);
          if (!indent && n)
            indent = n;
          else if (error === -1)
            error = offset + i;
        }
      }
      if (error !== -1)
        onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
      let hasSpace = false;
      let comment = "";
      let length = source.length;
      for (let i = 1; i < props.length; ++i) {
        const token = props[i];
        switch (token.type) {
          case "space":
            hasSpace = true;
          // fallthrough
          case "newline":
            length += token.source.length;
            break;
          case "comment":
            if (strict && !hasSpace) {
              const message = "Comments must be separated from other tokens by white space characters";
              onError(token, "MISSING_CHAR", message);
            }
            length += token.source.length;
            comment = token.source.substring(1);
            break;
          case "error":
            onError(token, "UNEXPECTED_TOKEN", token.message);
            length += token.source.length;
            break;
          /* istanbul ignore next should not happen */
          default: {
            const message = `Unexpected token in block scalar header: ${token.type}`;
            onError(token, "UNEXPECTED_TOKEN", message);
            const ts = token.source;
            if (ts && typeof ts === "string")
              length += ts.length;
          }
        }
      }
      return { mode, indent, chomp, comment, length };
    }
    function splitLines(source) {
      const split = source.split(/\n( *)/);
      const first = split[0];
      const m = first.match(/^( *)/);
      const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
      const lines = [line0];
      for (let i = 1; i < split.length; i += 2)
        lines.push([split[i], split[i + 1]]);
      return lines;
    }
    exports.resolveBlockScalar = resolveBlockScalar;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var resolveEnd = require_resolve_end();
    function resolveFlowScalar(scalar, strict, onError) {
      const { offset, type, source, end } = scalar;
      let _type;
      let value;
      const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
      switch (type) {
        case "scalar":
          _type = Scalar.Scalar.PLAIN;
          value = plainValue(source, _onError);
          break;
        case "single-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_SINGLE;
          value = singleQuotedValue(source, _onError);
          break;
        case "double-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_DOUBLE;
          value = doubleQuotedValue(source, _onError);
          break;
        /* istanbul ignore next should not happen */
        default:
          onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
          return {
            value: "",
            type: null,
            comment: "",
            range: [offset, offset + source.length, offset + source.length]
          };
      }
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
      return {
        value,
        type: _type,
        comment: re.comment,
        range: [offset, valueEnd, re.offset]
      };
    }
    function plainValue(source, onError) {
      let badChar = "";
      switch (source[0]) {
        /* istanbul ignore next should not happen */
        case "	":
          badChar = "a tab character";
          break;
        case ",":
          badChar = "flow indicator character ,";
          break;
        case "%":
          badChar = "directive indicator character %";
          break;
        case "|":
        case ">": {
          badChar = `block scalar indicator ${source[0]}`;
          break;
        }
        case "@":
        case "`": {
          badChar = `reserved character ${source[0]}`;
          break;
        }
      }
      if (badChar)
        onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
      return foldLines(source);
    }
    function singleQuotedValue(source, onError) {
      if (source[source.length - 1] !== "'" || source.length === 1)
        onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
      return foldLines(source.slice(1, -1)).replace(/''/g, "'");
    }
    function foldLines(source) {
      let first, line;
      try {
        first = new RegExp("(.*?)(?<![ 	])[ 	]*\r?\n", "sy");
        line = new RegExp("[ 	]*(.*?)(?:(?<![ 	])[ 	]*)?\r?\n", "sy");
      } catch {
        first = /(.*?)[ \t]*\r?\n/sy;
        line = /[ \t]*(.*?)[ \t]*\r?\n/sy;
      }
      let match = first.exec(source);
      if (!match)
        return source;
      let res = match[1];
      let sep11 = " ";
      let pos = first.lastIndex;
      line.lastIndex = pos;
      while (match = line.exec(source)) {
        if (match[1] === "") {
          if (sep11 === "\n")
            res += sep11;
          else
            sep11 = "\n";
        } else {
          res += sep11 + match[1];
          sep11 = " ";
        }
        pos = line.lastIndex;
      }
      const last = /[ \t]*(.*)/sy;
      last.lastIndex = pos;
      match = last.exec(source);
      return res + sep11 + (match?.[1] ?? "");
    }
    function doubleQuotedValue(source, onError) {
      let res = "";
      for (let i = 1; i < source.length - 1; ++i) {
        const ch = source[i];
        if (ch === "\r" && source[i + 1] === "\n")
          continue;
        if (ch === "\n") {
          const { fold, offset } = foldNewline(source, i);
          res += fold;
          i = offset;
        } else if (ch === "\\") {
          let next = source[++i];
          const cc = escapeCodes[next];
          if (cc)
            res += cc;
          else if (next === "\n") {
            next = source[i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "\r" && source[i + 1] === "\n") {
            next = source[++i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "x" || next === "u" || next === "U") {
            const length = next === "x" ? 2 : next === "u" ? 4 : 8;
            res += parseCharCode(source, i + 1, length, onError);
            i += length;
          } else {
            const raw = source.substr(i - 1, 2);
            onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
            res += raw;
          }
        } else if (ch === " " || ch === "	") {
          const wsStart = i;
          let next = source[i + 1];
          while (next === " " || next === "	")
            next = source[++i + 1];
          if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n"))
            res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
        } else {
          res += ch;
        }
      }
      if (source[source.length - 1] !== '"' || source.length === 1)
        onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
      return res;
    }
    function foldNewline(source, offset) {
      let fold = "";
      let ch = source[offset + 1];
      while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
        if (ch === "\r" && source[offset + 2] !== "\n")
          break;
        if (ch === "\n")
          fold += "\n";
        offset += 1;
        ch = source[offset + 1];
      }
      if (!fold)
        fold = " ";
      return { fold, offset };
    }
    var escapeCodes = {
      "0": "\0",
      // null character
      a: "\x07",
      // bell character
      b: "\b",
      // backspace
      e: "\x1B",
      // escape character
      f: "\f",
      // form feed
      n: "\n",
      // line feed
      r: "\r",
      // carriage return
      t: "	",
      // horizontal tab
      v: "\v",
      // vertical tab
      N: "\x85",
      // Unicode next line
      _: "\xA0",
      // Unicode non-breaking space
      L: "\u2028",
      // Unicode line separator
      P: "\u2029",
      // Unicode paragraph separator
      " ": " ",
      '"': '"',
      "/": "/",
      "\\": "\\",
      "	": "	"
    };
    function parseCharCode(source, offset, length, onError) {
      const cc = source.substr(offset, length);
      const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
      const code = ok ? parseInt(cc, 16) : NaN;
      try {
        return String.fromCodePoint(code);
      } catch {
        const raw = source.substr(offset - 2, length + 2);
        onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
        return raw;
      }
    }
    exports.resolveFlowScalar = resolveFlowScalar;
  }
});

// node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS({
  "node_modules/yaml/dist/compose/compose-scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    function composeScalar(ctx, token, tagToken, onError) {
      const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
      const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
      let tag;
      if (ctx.options.stringKeys && ctx.atKey) {
        tag = ctx.schema[identity.SCALAR];
      } else if (tagName)
        tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
      else if (token.type === "scalar")
        tag = findScalarTagByTest(ctx, value, token, onError);
      else
        tag = ctx.schema[identity.SCALAR];
      let scalar;
      try {
        const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
        scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
        scalar = new Scalar.Scalar(value);
      }
      scalar.range = range;
      scalar.source = value;
      if (type)
        scalar.type = type;
      if (tagName)
        scalar.tag = tagName;
      if (tag.format)
        scalar.format = tag.format;
      if (comment)
        scalar.comment = comment;
      return scalar;
    }
    function findScalarTagByName(schema, value, tagName, tagToken, onError) {
      if (tagName === "!")
        return schema[identity.SCALAR];
      const matchWithTest = [];
      for (const tag of schema.tags) {
        if (!tag.collection && tag.tag === tagName) {
          if (tag.default && tag.test)
            matchWithTest.push(tag);
          else
            return tag;
        }
      }
      for (const tag of matchWithTest)
        if (tag.test?.test(value))
          return tag;
      const kt = schema.knownTags[tagName];
      if (kt && !kt.collection) {
        schema.tags.push(Object.assign({}, kt, { default: false, test: void 0 }));
        return kt;
      }
      onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
      return schema[identity.SCALAR];
    }
    function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
      const tag = schema.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema[identity.SCALAR];
      if (schema.compat) {
        const compat = schema.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema[identity.SCALAR];
        if (tag.tag !== compat.tag) {
          const ts = directives.tagString(tag.tag);
          const cs = directives.tagString(compat.tag);
          const msg = `Value may be parsed as either ${ts} or ${cs}`;
          onError(token, "TAG_RESOLVE_FAILED", msg, true);
        }
      }
      return tag;
    }
    exports.composeScalar = composeScalar;
  }
});

// node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS({
  "node_modules/yaml/dist/compose/util-empty-scalar-position.js"(exports) {
    "use strict";
    function emptyScalarPosition(offset, before, pos) {
      if (before) {
        pos ?? (pos = before.length);
        for (let i = pos - 1; i >= 0; --i) {
          let st = before[i];
          switch (st.type) {
            case "space":
            case "comment":
            case "newline":
              offset -= st.source.length;
              continue;
          }
          st = before[++i];
          while (st?.type === "space") {
            offset += st.source.length;
            st = before[++i];
          }
          break;
        }
      }
      return offset;
    }
    exports.emptyScalarPosition = emptyScalarPosition;
  }
});

// node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS({
  "node_modules/yaml/dist/compose/compose-node.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var composeCollection = require_compose_collection();
    var composeScalar = require_compose_scalar();
    var resolveEnd = require_resolve_end();
    var utilEmptyScalarPosition = require_util_empty_scalar_position();
    var CN = { composeNode, composeEmptyNode };
    function composeNode(ctx, token, props, onError) {
      const atKey = ctx.atKey;
      const { spaceBefore, comment, anchor, tag } = props;
      let node;
      let isSrcToken = true;
      switch (token.type) {
        case "alias":
          node = composeAlias(ctx, token, onError);
          if (anchor || tag)
            onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
          break;
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "block-scalar":
          node = composeScalar.composeScalar(ctx, token, tag, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
          break;
        case "block-map":
        case "block-seq":
        case "flow-collection":
          try {
            node = composeCollection.composeCollection(CN, ctx, token, props, onError);
            if (anchor)
              node.anchor = anchor.source.substring(1);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            onError(token, "RESOURCE_EXHAUSTION", message);
          }
          break;
        default: {
          const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
          onError(token, "UNEXPECTED_TOKEN", message);
          isSrcToken = false;
        }
      }
      node ?? (node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError));
      if (anchor && node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
        const msg = "With stringKeys, all keys must be strings";
        onError(tag ?? token, "NON_STRING_KEY", msg);
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        if (token.type === "scalar" && token.source === "")
          node.comment = comment;
        else
          node.commentBefore = comment;
      }
      if (ctx.options.keepSourceTokens && isSrcToken)
        node.srcToken = token;
      return node;
    }
    function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
      const token = {
        type: "scalar",
        offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
        indent: -1,
        source: ""
      };
      const node = composeScalar.composeScalar(ctx, token, tag, onError);
      if (anchor) {
        node.anchor = anchor.source.substring(1);
        if (node.anchor === "")
          onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        node.comment = comment;
        node.range[2] = end;
      }
      return node;
    }
    function composeAlias({ options }, { offset, source, end }, onError) {
      const alias = new Alias.Alias(source.substring(1));
      if (alias.source === "")
        onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
      if (alias.source.endsWith(":"))
        onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
      alias.range = [offset, valueEnd, re.offset];
      if (re.comment)
        alias.comment = re.comment;
      return alias;
    }
    exports.composeEmptyNode = composeEmptyNode;
    exports.composeNode = composeNode;
  }
});

// node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS({
  "node_modules/yaml/dist/compose/compose-doc.js"(exports) {
    "use strict";
    var Document = require_Document();
    var composeNode = require_compose_node();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    function composeDoc(options, directives, { offset, start, value, end }, onError) {
      const opts = Object.assign({ _directives: directives }, options);
      const doc = new Document.Document(void 0, opts);
      const ctx = {
        atKey: false,
        atRoot: true,
        directives: doc.directives,
        options: doc.options,
        schema: doc.schema
      };
      const props = resolveProps.resolveProps(start, {
        indicator: "doc-start",
        next: value ?? end?.[0],
        offset,
        onError,
        parentIndent: 0,
        startOnNewline: true
      });
      if (props.found) {
        doc.directives.docStart = true;
        if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
          onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
      }
      doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
      const contentEnd = doc.contents.range[2];
      const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
      if (re.comment)
        doc.comment = re.comment;
      doc.range = [offset, contentEnd, re.offset];
      return doc;
    }
    exports.composeDoc = composeDoc;
  }
});

// node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS({
  "node_modules/yaml/dist/compose/composer.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var directives = require_directives();
    var Document = require_Document();
    var errors = require_errors();
    var identity = require_identity();
    var composeDoc = require_compose_doc();
    var resolveEnd = require_resolve_end();
    function getErrorPos(src) {
      if (typeof src === "number")
        return [src, src + 1];
      if (Array.isArray(src))
        return src.length === 2 ? src : [src[0], src[1]];
      const { offset, source } = src;
      return [offset, offset + (typeof source === "string" ? source.length : 1)];
    }
    function parsePrelude(prelude) {
      let comment = "";
      let atComment = false;
      let afterEmptyLine = false;
      for (let i = 0; i < prelude.length; ++i) {
        const source = prelude[i];
        switch (source[0]) {
          case "#":
            comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
            atComment = true;
            afterEmptyLine = false;
            break;
          case "%":
            if (prelude[i + 1]?.[0] !== "#")
              i += 1;
            atComment = false;
            break;
          default:
            if (!atComment)
              afterEmptyLine = true;
            atComment = false;
        }
      }
      return { comment, afterEmptyLine };
    }
    var Composer = class {
      constructor(options = {}) {
        this.doc = null;
        this.atDirectives = false;
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
        this.onError = (source, code, message, warning) => {
          const pos = getErrorPos(source);
          if (warning)
            this.warnings.push(new errors.YAMLWarning(pos, code, message));
          else
            this.errors.push(new errors.YAMLParseError(pos, code, message));
        };
        this.directives = new directives.Directives({ version: options.version || "1.2" });
        this.options = options;
      }
      decorate(doc, afterDoc) {
        const { comment, afterEmptyLine } = parsePrelude(this.prelude);
        if (comment) {
          const dc = doc.contents;
          if (afterDoc) {
            doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
          } else if (afterEmptyLine || doc.directives.docStart || !dc) {
            doc.commentBefore = comment;
          } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
            let it = dc.items[0];
            if (identity.isPair(it))
              it = it.key;
            const cb = it.commentBefore;
            it.commentBefore = cb ? `${comment}
${cb}` : comment;
          } else {
            const cb = dc.commentBefore;
            dc.commentBefore = cb ? `${comment}
${cb}` : comment;
          }
        }
        if (afterDoc) {
          for (let i = 0; i < this.errors.length; ++i)
            doc.errors.push(this.errors[i]);
          for (let i = 0; i < this.warnings.length; ++i)
            doc.warnings.push(this.warnings[i]);
        } else {
          doc.errors = this.errors;
          doc.warnings = this.warnings;
        }
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
      }
      /**
       * Current stream status information.
       *
       * Mostly useful at the end of input for an empty stream.
       */
      streamInfo() {
        return {
          comment: parsePrelude(this.prelude).comment,
          directives: this.directives,
          errors: this.errors,
          warnings: this.warnings
        };
      }
      /**
       * Compose tokens into documents.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *compose(tokens, forceDoc = false, endOffset = -1) {
        for (const token of tokens)
          yield* this.next(token);
        yield* this.end(forceDoc, endOffset);
      }
      /** Advance the composer by one CST token. */
      *next(token) {
        if (node_process.env.LOG_STREAM)
          console.dir(token, { depth: null });
        switch (token.type) {
          case "directive":
            this.directives.add(token.source, (offset, message, warning) => {
              const pos = getErrorPos(token);
              pos[0] += offset;
              this.onError(pos, "BAD_DIRECTIVE", message, warning);
            });
            this.prelude.push(token.source);
            this.atDirectives = true;
            break;
          case "document": {
            const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
            if (this.atDirectives && !doc.directives.docStart)
              this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
            this.decorate(doc, false);
            if (this.doc)
              yield this.doc;
            this.doc = doc;
            this.atDirectives = false;
            break;
          }
          case "byte-order-mark":
          case "space":
            break;
          case "comment":
          case "newline":
            this.prelude.push(token.source);
            break;
          case "error": {
            const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
            const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
            if (this.atDirectives || !this.doc)
              this.errors.push(error);
            else
              this.doc.errors.push(error);
            break;
          }
          case "doc-end": {
            if (!this.doc) {
              const msg = "Unexpected doc-end without preceding document";
              this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
              break;
            }
            this.doc.directives.docEnd = true;
            const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
            this.decorate(this.doc, true);
            if (end.comment) {
              const dc = this.doc.comment;
              this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
            }
            this.doc.range[2] = end.offset;
            break;
          }
          default:
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
        }
      }
      /**
       * Call at end of input to yield any remaining document.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *end(forceDoc = false, endOffset = -1) {
        if (this.doc) {
          this.decorate(this.doc, true);
          yield this.doc;
          this.doc = null;
        } else if (forceDoc) {
          const opts = Object.assign({ _directives: this.directives }, this.options);
          const doc = new Document.Document(void 0, opts);
          if (this.atDirectives)
            this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
          doc.range = [0, endOffset, endOffset];
          this.decorate(doc, false);
          yield doc;
        }
      }
    };
    exports.Composer = Composer;
  }
});

// node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS({
  "node_modules/yaml/dist/parse/cst-scalar.js"(exports) {
    "use strict";
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    var errors = require_errors();
    var stringifyString = require_stringifyString();
    function resolveAsScalar(token, strict = true, onError) {
      if (token) {
        const _onError = (pos, code, message) => {
          const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
          if (onError)
            onError(offset, code, message);
          else
            throw new errors.YAMLParseError([offset, offset + 1], code, message);
        };
        switch (token.type) {
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
          case "block-scalar":
            return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
        }
      }
      return null;
    }
    function createScalarToken(value, context) {
      const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey,
        indent: indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      const end = context.end ?? [
        { type: "newline", offset: -1, indent, source: "\n" }
      ];
      switch (source[0]) {
        case "|":
        case ">": {
          const he = source.indexOf("\n");
          const head = source.substring(0, he);
          const body = source.substring(he + 1) + "\n";
          const props = [
            { type: "block-scalar-header", offset, indent, source: head }
          ];
          if (!addEndtoBlockProps(props, end))
            props.push({ type: "newline", offset: -1, indent, source: "\n" });
          return { type: "block-scalar", offset, indent, props, source: body };
        }
        case '"':
          return { type: "double-quoted-scalar", offset, indent, source, end };
        case "'":
          return { type: "single-quoted-scalar", offset, indent, source, end };
        default:
          return { type: "scalar", offset, indent, source, end };
      }
    }
    function setScalarValue(token, value, context = {}) {
      let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
      let indent = "indent" in token ? token.indent : null;
      if (afterKey && typeof indent === "number")
        indent += 2;
      if (!type)
        switch (token.type) {
          case "single-quoted-scalar":
            type = "QUOTE_SINGLE";
            break;
          case "double-quoted-scalar":
            type = "QUOTE_DOUBLE";
            break;
          case "block-scalar": {
            const header = token.props[0];
            if (header.type !== "block-scalar-header")
              throw new Error("Invalid block scalar header");
            type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
            break;
          }
          default:
            type = "PLAIN";
        }
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey: implicitKey || indent === null,
        indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      switch (source[0]) {
        case "|":
        case ">":
          setBlockScalarValue(token, source);
          break;
        case '"':
          setFlowScalarValue(token, source, "double-quoted-scalar");
          break;
        case "'":
          setFlowScalarValue(token, source, "single-quoted-scalar");
          break;
        default:
          setFlowScalarValue(token, source, "scalar");
      }
    }
    function setBlockScalarValue(token, source) {
      const he = source.indexOf("\n");
      const head = source.substring(0, he);
      const body = source.substring(he + 1) + "\n";
      if (token.type === "block-scalar") {
        const header = token.props[0];
        if (header.type !== "block-scalar-header")
          throw new Error("Invalid block scalar header");
        header.source = head;
        token.source = body;
      } else {
        const { offset } = token;
        const indent = "indent" in token ? token.indent : -1;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0))
          props.push({ type: "newline", offset: -1, indent, source: "\n" });
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type: "block-scalar", indent, props, source: body });
      }
    }
    function addEndtoBlockProps(props, end) {
      if (end)
        for (const st of end)
          switch (st.type) {
            case "space":
            case "comment":
              props.push(st);
              break;
            case "newline":
              props.push(st);
              return true;
          }
      return false;
    }
    function setFlowScalarValue(token, source, type) {
      switch (token.type) {
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          token.type = type;
          token.source = source;
          break;
        case "block-scalar": {
          const end = token.props.slice(1);
          let oa = source.length;
          if (token.props[0].type === "block-scalar-header")
            oa -= token.props[0].source.length;
          for (const tok of end)
            tok.offset += oa;
          delete token.props;
          Object.assign(token, { type, source, end });
          break;
        }
        case "block-map":
        case "block-seq": {
          const offset = token.offset + source.length;
          const nl = { type: "newline", offset, indent: token.indent, source: "\n" };
          delete token.items;
          Object.assign(token, { type, source, end: [nl] });
          break;
        }
        default: {
          const indent = "indent" in token ? token.indent : -1;
          const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
          for (const key of Object.keys(token))
            if (key !== "type" && key !== "offset")
              delete token[key];
          Object.assign(token, { type, indent, source, end });
        }
      }
    }
    exports.createScalarToken = createScalarToken;
    exports.resolveAsScalar = resolveAsScalar;
    exports.setScalarValue = setScalarValue;
  }
});

// node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS({
  "node_modules/yaml/dist/parse/cst-stringify.js"(exports) {
    "use strict";
    var stringify3 = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
    function stringifyToken(token) {
      switch (token.type) {
        case "block-scalar": {
          let res = "";
          for (const tok of token.props)
            res += stringifyToken(tok);
          return res + token.source;
        }
        case "block-map":
        case "block-seq": {
          let res = "";
          for (const item of token.items)
            res += stringifyItem(item);
          return res;
        }
        case "flow-collection": {
          let res = token.start.source;
          for (const item of token.items)
            res += stringifyItem(item);
          for (const st of token.end)
            res += st.source;
          return res;
        }
        case "document": {
          let res = stringifyItem(token);
          if (token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
        default: {
          let res = token.source;
          if ("end" in token && token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
      }
    }
    function stringifyItem({ start, key, sep: sep11, value }) {
      let res = "";
      for (const st of start)
        res += st.source;
      if (key)
        res += stringifyToken(key);
      if (sep11)
        for (const st of sep11)
          res += st.source;
      if (value)
        res += stringifyToken(value);
      return res;
    }
    exports.stringify = stringify3;
  }
});

// node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS({
  "node_modules/yaml/dist/parse/cst-visit.js"(exports) {
    "use strict";
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove item");
    function visit(cst, visitor) {
      if ("type" in cst && cst.type === "document")
        cst = { start: cst.start, value: cst.value };
      _visit(Object.freeze([]), cst, visitor);
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    visit.itemAtPath = (cst, path) => {
      let item = cst;
      for (const [field, index] of path) {
        const tok = item?.[field];
        if (tok && "items" in tok) {
          item = tok.items[index];
        } else
          return void 0;
      }
      return item;
    };
    visit.parentCollection = (cst, path) => {
      const parent = visit.itemAtPath(cst, path.slice(0, -1));
      const field = path[path.length - 1][0];
      const coll = parent?.[field];
      if (coll && "items" in coll)
        return coll;
      throw new Error("Parent collection not found");
    };
    function _visit(path, item, visitor) {
      let ctrl = visitor(item, path);
      if (typeof ctrl === "symbol")
        return ctrl;
      for (const field of ["key", "value"]) {
        const token = item[field];
        if (token && "items" in token) {
          for (let i = 0; i < token.items.length; ++i) {
            const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              token.items.splice(i, 1);
              i -= 1;
            }
          }
          if (typeof ctrl === "function" && field === "key")
            ctrl = ctrl(item, path);
        }
      }
      return typeof ctrl === "function" ? ctrl(item, path) : ctrl;
    }
    exports.visit = visit;
  }
});

// node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS({
  "node_modules/yaml/dist/parse/cst.js"(exports) {
    "use strict";
    var cstScalar = require_cst_scalar();
    var cstStringify = require_cst_stringify();
    var cstVisit = require_cst_visit();
    var BOM = "\uFEFF";
    var DOCUMENT = "";
    var FLOW_END = "";
    var SCALAR = "";
    var isCollection = (token) => !!token && "items" in token;
    var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
    function prettyToken(token) {
      switch (token) {
        case BOM:
          return "<BOM>";
        case DOCUMENT:
          return "<DOC>";
        case FLOW_END:
          return "<FLOW_END>";
        case SCALAR:
          return "<SCALAR>";
        default:
          return JSON.stringify(token);
      }
    }
    function tokenType(source) {
      switch (source) {
        case BOM:
          return "byte-order-mark";
        case DOCUMENT:
          return "doc-mode";
        case FLOW_END:
          return "flow-error-end";
        case SCALAR:
          return "scalar";
        case "---":
          return "doc-start";
        case "...":
          return "doc-end";
        case "":
        case "\n":
        case "\r\n":
          return "newline";
        case "-":
          return "seq-item-ind";
        case "?":
          return "explicit-key-ind";
        case ":":
          return "map-value-ind";
        case "{":
          return "flow-map-start";
        case "}":
          return "flow-map-end";
        case "[":
          return "flow-seq-start";
        case "]":
          return "flow-seq-end";
        case ",":
          return "comma";
      }
      switch (source[0]) {
        case " ":
        case "	":
          return "space";
        case "#":
          return "comment";
        case "%":
          return "directive-line";
        case "*":
          return "alias";
        case "&":
          return "anchor";
        case "!":
          return "tag";
        case "'":
          return "single-quoted-scalar";
        case '"':
          return "double-quoted-scalar";
        case "|":
        case ">":
          return "block-scalar-header";
      }
      return null;
    }
    exports.createScalarToken = cstScalar.createScalarToken;
    exports.resolveAsScalar = cstScalar.resolveAsScalar;
    exports.setScalarValue = cstScalar.setScalarValue;
    exports.stringify = cstStringify.stringify;
    exports.visit = cstVisit.visit;
    exports.BOM = BOM;
    exports.DOCUMENT = DOCUMENT;
    exports.FLOW_END = FLOW_END;
    exports.SCALAR = SCALAR;
    exports.isCollection = isCollection;
    exports.isScalar = isScalar;
    exports.prettyToken = prettyToken;
    exports.tokenType = tokenType;
  }
});

// node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS({
  "node_modules/yaml/dist/parse/lexer.js"(exports) {
    "use strict";
    var cst = require_cst();
    function isEmpty(ch) {
      switch (ch) {
        case void 0:
        case " ":
        case "\n":
        case "\r":
        case "	":
          return true;
        default:
          return false;
      }
    }
    var hexDigits = new Set("0123456789ABCDEFabcdef");
    var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
    var flowIndicatorChars = new Set(",[]{}");
    var invalidAnchorChars = new Set(" ,[]{}\n\r	");
    var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
    var Lexer = class {
      constructor() {
        this.atEnd = false;
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        this.buffer = "";
        this.flowKey = false;
        this.flowLevel = 0;
        this.indentNext = 0;
        this.indentValue = 0;
        this.lineEndPos = null;
        this.next = null;
        this.pos = 0;
      }
      /**
       * Generate YAML tokens from the `source` string. If `incomplete`,
       * a part of the last line may be left as a buffer for the next call.
       *
       * @returns A generator of lexical tokens
       */
      *lex(source, incomplete = false) {
        if (source) {
          if (typeof source !== "string")
            throw TypeError("source is not a string");
          this.buffer = this.buffer ? this.buffer + source : source;
          this.lineEndPos = null;
        }
        this.atEnd = !incomplete;
        let next = this.next ?? "stream";
        while (next && (incomplete || this.hasChars(1)))
          next = yield* this.parseNext(next);
      }
      atLineEnd() {
        let i = this.pos;
        let ch = this.buffer[i];
        while (ch === " " || ch === "	")
          ch = this.buffer[++i];
        if (!ch || ch === "#" || ch === "\n")
          return true;
        if (ch === "\r")
          return this.buffer[i + 1] === "\n";
        return false;
      }
      charAt(n) {
        return this.buffer[this.pos + n];
      }
      continueScalar(offset) {
        let ch = this.buffer[offset];
        if (this.indentNext > 0) {
          let indent = 0;
          while (ch === " ")
            ch = this.buffer[++indent + offset];
          if (ch === "\r") {
            const next = this.buffer[indent + offset + 1];
            if (next === "\n" || !next && !this.atEnd)
              return offset + indent + 1;
          }
          return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
        }
        if (ch === "-" || ch === ".") {
          const dt = this.buffer.substr(offset, 3);
          if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
            return -1;
        }
        return offset;
      }
      getLine() {
        let end = this.lineEndPos;
        if (typeof end !== "number" || end !== -1 && end < this.pos) {
          end = this.buffer.indexOf("\n", this.pos);
          this.lineEndPos = end;
        }
        if (end === -1)
          return this.atEnd ? this.buffer.substring(this.pos) : null;
        if (this.buffer[end - 1] === "\r")
          end -= 1;
        return this.buffer.substring(this.pos, end);
      }
      hasChars(n) {
        return this.pos + n <= this.buffer.length;
      }
      setNext(state) {
        this.buffer = this.buffer.substring(this.pos);
        this.pos = 0;
        this.lineEndPos = null;
        this.next = state;
        return null;
      }
      peek(n) {
        return this.buffer.substr(this.pos, n);
      }
      *parseNext(next) {
        switch (next) {
          case "stream":
            return yield* this.parseStream();
          case "line-start":
            return yield* this.parseLineStart();
          case "block-start":
            return yield* this.parseBlockStart();
          case "doc":
            return yield* this.parseDocument();
          case "flow":
            return yield* this.parseFlowCollection();
          case "quoted-scalar":
            return yield* this.parseQuotedScalar();
          case "block-scalar":
            return yield* this.parseBlockScalar();
          case "plain-scalar":
            return yield* this.parsePlainScalar();
        }
      }
      *parseStream() {
        let line = this.getLine();
        if (line === null)
          return this.setNext("stream");
        if (line[0] === cst.BOM) {
          yield* this.pushCount(1);
          line = line.substring(1);
        }
        if (line[0] === "%") {
          let dirEnd = line.length;
          let cs = line.indexOf("#");
          while (cs !== -1) {
            const ch = line[cs - 1];
            if (ch === " " || ch === "	") {
              dirEnd = cs - 1;
              break;
            } else {
              cs = line.indexOf("#", cs + 1);
            }
          }
          while (true) {
            const ch = line[dirEnd - 1];
            if (ch === " " || ch === "	")
              dirEnd -= 1;
            else
              break;
          }
          const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
          yield* this.pushCount(line.length - n);
          this.pushNewline();
          return "stream";
        }
        if (this.atLineEnd()) {
          const sp = yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - sp);
          yield* this.pushNewline();
          return "stream";
        }
        yield cst.DOCUMENT;
        return yield* this.parseLineStart();
      }
      *parseLineStart() {
        const ch = this.charAt(0);
        if (!ch && !this.atEnd)
          return this.setNext("line-start");
        if (ch === "-" || ch === ".") {
          if (!this.atEnd && !this.hasChars(4))
            return this.setNext("line-start");
          const s = this.peek(3);
          if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
            yield* this.pushCount(3);
            this.indentValue = 0;
            this.indentNext = 0;
            return s === "---" ? "doc" : "stream";
          }
        }
        this.indentValue = yield* this.pushSpaces(false);
        if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
          this.indentNext = this.indentValue;
        return yield* this.parseBlockStart();
      }
      *parseBlockStart() {
        const [ch0, ch1] = this.peek(2);
        if (!ch1 && !this.atEnd)
          return this.setNext("block-start");
        if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
          const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
          this.indentNext = this.indentValue + 1;
          this.indentValue += n;
          return "block-start";
        }
        return "doc";
      }
      *parseDocument() {
        yield* this.pushSpaces(true);
        const line = this.getLine();
        if (line === null)
          return this.setNext("doc");
        let n = yield* this.pushIndicators();
        switch (line[n]) {
          case "#":
            yield* this.pushCount(line.length - n);
          // fallthrough
          case void 0:
            yield* this.pushNewline();
            return yield* this.parseLineStart();
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel = 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            return "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "doc";
          case '"':
          case "'":
            return yield* this.parseQuotedScalar();
          case "|":
          case ">":
            n += yield* this.parseBlockScalarHeader();
            n += yield* this.pushSpaces(true);
            yield* this.pushCount(line.length - n);
            yield* this.pushNewline();
            return yield* this.parseBlockScalar();
          default:
            return yield* this.parsePlainScalar();
        }
      }
      *parseFlowCollection() {
        let nl, sp;
        let indent = -1;
        do {
          nl = yield* this.pushNewline();
          if (nl > 0) {
            sp = yield* this.pushSpaces(false);
            this.indentValue = indent = sp;
          } else {
            sp = 0;
          }
          sp += yield* this.pushSpaces(true);
        } while (nl + sp > 0);
        const line = this.getLine();
        if (line === null)
          return this.setNext("flow");
        if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
          const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
          if (!atFlowEndMarker) {
            this.flowLevel = 0;
            yield cst.FLOW_END;
            return yield* this.parseLineStart();
          }
        }
        let n = 0;
        while (line[n] === ",") {
          n += yield* this.pushCount(1);
          n += yield* this.pushSpaces(true);
          this.flowKey = false;
        }
        n += yield* this.pushIndicators();
        switch (line[n]) {
          case void 0:
            return "flow";
          case "#":
            yield* this.pushCount(line.length - n);
            return "flow";
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel += 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            this.flowKey = true;
            this.flowLevel -= 1;
            return this.flowLevel ? "flow" : "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "flow";
          case '"':
          case "'":
            this.flowKey = true;
            return yield* this.parseQuotedScalar();
          case ":": {
            const next = this.charAt(1);
            if (this.flowKey || isEmpty(next) || next === ",") {
              this.flowKey = false;
              yield* this.pushCount(1);
              yield* this.pushSpaces(true);
              return "flow";
            }
          }
          // fallthrough
          default:
            this.flowKey = false;
            return yield* this.parsePlainScalar();
        }
      }
      *parseQuotedScalar() {
        const quote = this.charAt(0);
        let end = this.buffer.indexOf(quote, this.pos + 1);
        if (quote === "'") {
          while (end !== -1 && this.buffer[end + 1] === "'")
            end = this.buffer.indexOf("'", end + 2);
        } else {
          while (end !== -1) {
            let n = 0;
            while (this.buffer[end - 1 - n] === "\\")
              n += 1;
            if (n % 2 === 0)
              break;
            end = this.buffer.indexOf('"', end + 1);
          }
        }
        const qb = this.buffer.substring(0, end);
        let nl = qb.indexOf("\n", this.pos);
        if (nl !== -1) {
          while (nl !== -1) {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = qb.indexOf("\n", cs);
          }
          if (nl !== -1) {
            end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
          }
        }
        if (end === -1) {
          if (!this.atEnd)
            return this.setNext("quoted-scalar");
          end = this.buffer.length;
        }
        yield* this.pushToIndex(end + 1, false);
        return this.flowLevel ? "flow" : "doc";
      }
      *parseBlockScalarHeader() {
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        let i = this.pos;
        while (true) {
          const ch = this.buffer[++i];
          if (ch === "+")
            this.blockScalarKeep = true;
          else if (ch > "0" && ch <= "9")
            this.blockScalarIndent = Number(ch) - 1;
          else if (ch !== "-")
            break;
        }
        return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
      }
      *parseBlockScalar() {
        let nl = this.pos - 1;
        let indent = 0;
        let ch;
        loop: for (let i2 = this.pos; ch = this.buffer[i2]; ++i2) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case "\n":
              nl = i2;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i2 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === "\n")
                break;
            }
            // fallthrough
            default:
              break loop;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("block-scalar");
        if (indent >= this.indentNext) {
          if (this.blockScalarIndent === -1)
            this.indentNext = indent;
          else {
            this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
          }
          do {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = this.buffer.indexOf("\n", cs);
          } while (nl !== -1);
          if (nl === -1) {
            if (!this.atEnd)
              return this.setNext("block-scalar");
            nl = this.buffer.length;
          }
        }
        let i = nl + 1;
        ch = this.buffer[i];
        while (ch === " ")
          ch = this.buffer[++i];
        if (ch === "	") {
          while (ch === "	" || ch === " " || ch === "\r" || ch === "\n")
            ch = this.buffer[++i];
          nl = i - 1;
        } else if (!this.blockScalarKeep) {
          do {
            let i2 = nl - 1;
            let ch2 = this.buffer[i2];
            if (ch2 === "\r")
              ch2 = this.buffer[--i2];
            const lastChar = i2;
            while (ch2 === " ")
              ch2 = this.buffer[--i2];
            if (ch2 === "\n" && i2 >= this.pos && i2 + 1 + indent > lastChar)
              nl = i2;
            else
              break;
          } while (true);
        }
        yield cst.SCALAR;
        yield* this.pushToIndex(nl + 1, true);
        return yield* this.parseLineStart();
      }
      *parsePlainScalar() {
        const inFlow = this.flowLevel > 0;
        let end = this.pos - 1;
        let i = this.pos - 1;
        let ch;
        while (ch = this.buffer[++i]) {
          if (ch === ":") {
            const next = this.buffer[i + 1];
            if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
              break;
            end = i;
          } else if (isEmpty(ch)) {
            let next = this.buffer[i + 1];
            if (ch === "\r") {
              if (next === "\n") {
                i += 1;
                ch = "\n";
                next = this.buffer[i + 1];
              } else
                end = i;
            }
            if (next === "#" || inFlow && flowIndicatorChars.has(next))
              break;
            if (ch === "\n") {
              const cs = this.continueScalar(i + 1);
              if (cs === -1)
                break;
              i = Math.max(i, cs - 2);
            }
          } else {
            if (inFlow && flowIndicatorChars.has(ch))
              break;
            end = i;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("plain-scalar");
        yield cst.SCALAR;
        yield* this.pushToIndex(end + 1, true);
        return inFlow ? "flow" : "doc";
      }
      *pushCount(n) {
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos += n;
          return n;
        }
        return 0;
      }
      *pushToIndex(i, allowEmpty) {
        const s = this.buffer.slice(this.pos, i);
        if (s) {
          yield s;
          this.pos += s.length;
          return s.length;
        } else if (allowEmpty)
          yield "";
        return 0;
      }
      *pushIndicators() {
        let n = 0;
        loop: while (true) {
          switch (this.charAt(0)) {
            case "!":
              n += yield* this.pushTag();
              n += yield* this.pushSpaces(true);
              continue loop;
            case "&":
              n += yield* this.pushUntil(isNotAnchorChar);
              n += yield* this.pushSpaces(true);
              continue loop;
            case "-":
            // this is an error
            case "?":
            // this is an error outside flow collections
            case ":": {
              const inFlow = this.flowLevel > 0;
              const ch1 = this.charAt(1);
              if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
                if (!inFlow)
                  this.indentNext = this.indentValue + 1;
                else if (this.flowKey)
                  this.flowKey = false;
                n += yield* this.pushCount(1);
                n += yield* this.pushSpaces(true);
                continue loop;
              }
            }
          }
          break loop;
        }
        return n;
      }
      *pushTag() {
        if (this.charAt(1) === "<") {
          let i = this.pos + 2;
          let ch = this.buffer[i];
          while (!isEmpty(ch) && ch !== ">")
            ch = this.buffer[++i];
          return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
        } else {
          let i = this.pos + 1;
          let ch = this.buffer[i];
          while (ch) {
            if (tagChars.has(ch))
              ch = this.buffer[++i];
            else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
              ch = this.buffer[i += 3];
            } else
              break;
          }
          return yield* this.pushToIndex(i, false);
        }
      }
      *pushNewline() {
        const ch = this.buffer[this.pos];
        if (ch === "\n")
          return yield* this.pushCount(1);
        else if (ch === "\r" && this.charAt(1) === "\n")
          return yield* this.pushCount(2);
        else
          return 0;
      }
      *pushSpaces(allowTabs) {
        let i = this.pos - 1;
        let ch;
        do {
          ch = this.buffer[++i];
        } while (ch === " " || allowTabs && ch === "	");
        const n = i - this.pos;
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos = i;
        }
        return n;
      }
      *pushUntil(test) {
        let i = this.pos;
        let ch = this.buffer[i];
        while (!test(ch))
          ch = this.buffer[++i];
        return yield* this.pushToIndex(i, false);
      }
    };
    exports.Lexer = Lexer;
  }
});

// node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS({
  "node_modules/yaml/dist/parse/line-counter.js"(exports) {
    "use strict";
    var LineCounter = class {
      constructor() {
        this.lineStarts = [];
        this.addNewLine = (offset) => this.lineStarts.push(offset);
        this.linePos = (offset) => {
          let low = 0;
          let high = this.lineStarts.length;
          while (low < high) {
            const mid = low + high >> 1;
            if (this.lineStarts[mid] < offset)
              low = mid + 1;
            else
              high = mid;
          }
          if (this.lineStarts[low] === offset)
            return { line: low + 1, col: 1 };
          if (low === 0)
            return { line: 0, col: offset };
          const start = this.lineStarts[low - 1];
          return { line: low, col: offset - start + 1 };
        };
      }
    };
    exports.LineCounter = LineCounter;
  }
});

// node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS({
  "node_modules/yaml/dist/parse/parser.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var cst = require_cst();
    var lexer = require_lexer();
    function includesToken(list, type) {
      for (let i = 0; i < list.length; ++i)
        if (list[i].type === type)
          return true;
      return false;
    }
    function findNonEmptyIndex(list) {
      for (let i = 0; i < list.length; ++i) {
        switch (list[i].type) {
          case "space":
          case "comment":
          case "newline":
            break;
          default:
            return i;
        }
      }
      return -1;
    }
    function isFlowToken(token) {
      switch (token?.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "flow-collection":
          return true;
        default:
          return false;
      }
    }
    function getPrevProps(parent) {
      switch (parent.type) {
        case "document":
          return parent.start;
        case "block-map": {
          const it = parent.items[parent.items.length - 1];
          return it.sep ?? it.start;
        }
        case "block-seq":
          return parent.items[parent.items.length - 1].start;
        /* istanbul ignore next should not happen */
        default:
          return [];
      }
    }
    function getFirstKeyStartProps(prev) {
      if (prev.length === 0)
        return [];
      let i = prev.length;
      loop: while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
      while (prev[++i]?.type === "space") {
      }
      return prev.splice(i, prev.length);
    }
    function arrayPushArray(target, source) {
      if (source.length < 1e5)
        Array.prototype.push.apply(target, source);
      else
        for (let i = 0; i < source.length; ++i)
          target.push(source[i]);
    }
    function fixFlowSeqItems(fc) {
      if (fc.start.type === "flow-seq-start") {
        for (const it of fc.items) {
          if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
            if (it.key)
              it.value = it.key;
            delete it.key;
            if (isFlowToken(it.value)) {
              if (it.value.end)
                arrayPushArray(it.value.end, it.sep);
              else
                it.value.end = it.sep;
            } else
              arrayPushArray(it.start, it.sep);
            delete it.sep;
          }
        }
      }
    }
    var Parser = class {
      /**
       * @param onNewLine - If defined, called separately with the start position of
       *   each new line (in `parse()`, including the start of input).
       */
      constructor(onNewLine) {
        this.atNewLine = true;
        this.atScalar = false;
        this.indent = 0;
        this.offset = 0;
        this.onKeyLine = false;
        this.stack = [];
        this.source = "";
        this.type = "";
        this.lexer = new lexer.Lexer();
        this.onNewLine = onNewLine;
      }
      /**
       * Parse `source` as a YAML stream.
       * If `incomplete`, a part of the last line may be left as a buffer for the next call.
       *
       * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
       *
       * @returns A generator of tokens representing each directive, document, and other structure.
       */
      *parse(source, incomplete = false) {
        if (this.onNewLine && this.offset === 0)
          this.onNewLine(0);
        for (const lexeme of this.lexer.lex(source, incomplete))
          yield* this.next(lexeme);
        if (!incomplete)
          yield* this.end();
      }
      /**
       * Advance the parser by the `source` of one lexical token.
       */
      *next(source) {
        this.source = source;
        if (node_process.env.LOG_TOKENS)
          console.log("|", cst.prettyToken(source));
        if (this.atScalar) {
          this.atScalar = false;
          yield* this.step();
          this.offset += source.length;
          return;
        }
        const type = cst.tokenType(source);
        if (!type) {
          const message = `Not a YAML token: ${source}`;
          yield* this.pop({ type: "error", offset: this.offset, message, source });
          this.offset += source.length;
        } else if (type === "scalar") {
          this.atNewLine = false;
          this.atScalar = true;
          this.type = "scalar";
        } else {
          this.type = type;
          yield* this.step();
          switch (type) {
            case "newline":
              this.atNewLine = true;
              this.indent = 0;
              if (this.onNewLine)
                this.onNewLine(this.offset + source.length);
              break;
            case "space":
              if (this.atNewLine && source[0] === " ")
                this.indent += source.length;
              break;
            case "explicit-key-ind":
            case "map-value-ind":
            case "seq-item-ind":
              if (this.atNewLine)
                this.indent += source.length;
              break;
            case "doc-mode":
            case "flow-error-end":
              return;
            default:
              this.atNewLine = false;
          }
          this.offset += source.length;
        }
      }
      /** Call at end of input to push out any remaining constructions */
      *end() {
        while (this.stack.length > 0)
          yield* this.pop();
      }
      get sourceToken() {
        const st = {
          type: this.type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
        return st;
      }
      *step() {
        const top = this.peek(1);
        if (this.type === "doc-end" && top?.type !== "doc-end") {
          while (this.stack.length > 0)
            yield* this.pop();
          this.stack.push({
            type: "doc-end",
            offset: this.offset,
            source: this.source
          });
          return;
        }
        if (!top)
          return yield* this.stream();
        switch (top.type) {
          case "document":
            return yield* this.document(top);
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return yield* this.scalar(top);
          case "block-scalar":
            return yield* this.blockScalar(top);
          case "block-map":
            return yield* this.blockMap(top);
          case "block-seq":
            return yield* this.blockSequence(top);
          case "flow-collection":
            return yield* this.flowCollection(top);
          case "doc-end":
            return yield* this.documentEnd(top);
        }
        yield* this.pop();
      }
      peek(n) {
        return this.stack[this.stack.length - n];
      }
      *pop(error) {
        const token = error ?? this.stack.pop();
        if (!token) {
          const message = "Tried to pop an empty stack";
          yield { type: "error", offset: this.offset, source: "", message };
        } else if (this.stack.length === 0) {
          yield token;
        } else {
          const top = this.peek(1);
          if (token.type === "block-scalar") {
            token.indent = "indent" in top ? top.indent : 0;
          } else if (token.type === "flow-collection" && top.type === "document") {
            token.indent = 0;
          }
          if (token.type === "flow-collection")
            fixFlowSeqItems(token);
          switch (top.type) {
            case "document":
              top.value = token;
              break;
            case "block-scalar":
              top.props.push(token);
              break;
            case "block-map": {
              const it = top.items[top.items.length - 1];
              if (it.value) {
                top.items.push({ start: [], key: token, sep: [] });
                this.onKeyLine = true;
                return;
              } else if (it.sep) {
                it.value = token;
              } else {
                Object.assign(it, { key: token, sep: [] });
                this.onKeyLine = !it.explicitKey;
                return;
              }
              break;
            }
            case "block-seq": {
              const it = top.items[top.items.length - 1];
              if (it.value)
                top.items.push({ start: [], value: token });
              else
                it.value = token;
              break;
            }
            case "flow-collection": {
              const it = top.items[top.items.length - 1];
              if (!it || it.value)
                top.items.push({ start: [], key: token, sep: [] });
              else if (it.sep)
                it.value = token;
              else
                Object.assign(it, { key: token, sep: [] });
              return;
            }
            /* istanbul ignore next should not happen */
            default:
              yield* this.pop();
              yield* this.pop(token);
          }
          if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
            const last = token.items[token.items.length - 1];
            if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
              if (top.type === "document")
                top.end = last.start;
              else
                top.items.push({ start: last.start });
              token.items.splice(-1, 1);
            }
          }
        }
      }
      *stream() {
        switch (this.type) {
          case "directive-line":
            yield { type: "directive", offset: this.offset, source: this.source };
            return;
          case "byte-order-mark":
          case "space":
          case "comment":
          case "newline":
            yield this.sourceToken;
            return;
          case "doc-mode":
          case "doc-start": {
            const doc = {
              type: "document",
              offset: this.offset,
              start: []
            };
            if (this.type === "doc-start")
              doc.start.push(this.sourceToken);
            this.stack.push(doc);
            return;
          }
        }
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML stream`,
          source: this.source
        };
      }
      *document(doc) {
        if (doc.value)
          return yield* this.lineEnd(doc);
        switch (this.type) {
          case "doc-start": {
            if (findNonEmptyIndex(doc.start) !== -1) {
              yield* this.pop();
              yield* this.step();
            } else
              doc.start.push(this.sourceToken);
            return;
          }
          case "anchor":
          case "tag":
          case "space":
          case "comment":
          case "newline":
            doc.start.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(doc);
        if (bv)
          this.stack.push(bv);
        else {
          yield {
            type: "error",
            offset: this.offset,
            message: `Unexpected ${this.type} token in YAML document`,
            source: this.source
          };
        }
      }
      *scalar(scalar) {
        if (this.type === "map-value-ind") {
          const prev = getPrevProps(this.peek(2));
          const start = getFirstKeyStartProps(prev);
          let sep11;
          if (scalar.end) {
            sep11 = scalar.end;
            sep11.push(this.sourceToken);
            delete scalar.end;
          } else
            sep11 = [this.sourceToken];
          const map = {
            type: "block-map",
            offset: scalar.offset,
            indent: scalar.indent,
            items: [{ start, key: scalar, sep: sep11 }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else
          yield* this.lineEnd(scalar);
      }
      *blockScalar(scalar) {
        switch (this.type) {
          case "space":
          case "comment":
          case "newline":
            scalar.props.push(this.sourceToken);
            return;
          case "scalar":
            scalar.source = this.source;
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine) {
              let nl = this.source.indexOf("\n") + 1;
              while (nl !== 0) {
                this.onNewLine(this.offset + nl);
                nl = this.source.indexOf("\n", nl) + 1;
              }
            }
            yield* this.pop();
            break;
          /* istanbul ignore next should not happen */
          default:
            yield* this.pop();
            yield* this.step();
        }
      }
      *blockMap(map) {
        const it = map.items[map.items.length - 1];
        switch (this.type) {
          case "newline":
            this.onKeyLine = false;
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "space":
          case "comment":
            if (it.value) {
              map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              if (this.atIndentedComment(it.start, map.indent)) {
                const prev = map.items[map.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  map.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
        }
        if (this.indent >= map.indent) {
          const atMapIndent = !this.onKeyLine && this.indent === map.indent;
          const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
          let start = [];
          if (atNextItem && it.sep && !it.value) {
            const nl = [];
            for (let i = 0; i < it.sep.length; ++i) {
              const st = it.sep[i];
              switch (st.type) {
                case "newline":
                  nl.push(i);
                  break;
                case "space":
                  break;
                case "comment":
                  if (st.indent > map.indent)
                    nl.length = 0;
                  break;
                default:
                  nl.length = 0;
              }
            }
            if (nl.length >= 2)
              start = it.sep.splice(nl[1]);
          }
          switch (this.type) {
            case "anchor":
            case "tag":
              if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start });
                this.onKeyLine = true;
              } else if (it.sep) {
                it.sep.push(this.sourceToken);
              } else {
                it.start.push(this.sourceToken);
              }
              return;
            case "explicit-key-ind":
              if (!it.sep && !it.explicitKey) {
                it.start.push(this.sourceToken);
                it.explicitKey = true;
              } else if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start, explicitKey: true });
              } else {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [this.sourceToken], explicitKey: true }]
                });
              }
              this.onKeyLine = true;
              return;
            case "map-value-ind":
              if (it.explicitKey) {
                if (!it.sep) {
                  if (includesToken(it.start, "newline")) {
                    Object.assign(it, { key: null, sep: [this.sourceToken] });
                  } else {
                    const start2 = getFirstKeyStartProps(it.start);
                    this.stack.push({
                      type: "block-map",
                      offset: this.offset,
                      indent: this.indent,
                      items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                    });
                  }
                } else if (it.value) {
                  map.items.push({ start: [], key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, key: null, sep: [this.sourceToken] }]
                  });
                } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                  const start2 = getFirstKeyStartProps(it.start);
                  const key = it.key;
                  const sep11 = it.sep;
                  sep11.push(this.sourceToken);
                  delete it.key;
                  delete it.sep;
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key, sep: sep11 }]
                  });
                } else if (start.length > 0) {
                  it.sep = it.sep.concat(start, this.sourceToken);
                } else {
                  it.sep.push(this.sourceToken);
                }
              } else {
                if (!it.sep) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else if (it.value || atNextItem) {
                  map.items.push({ start, key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: [], key: null, sep: [this.sourceToken] }]
                  });
                } else {
                  it.sep.push(this.sourceToken);
                }
              }
              this.onKeyLine = true;
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (atNextItem || it.value) {
                map.items.push({ start, key: fs, sep: [] });
                this.onKeyLine = true;
              } else if (it.sep) {
                this.stack.push(fs);
              } else {
                Object.assign(it, { key: fs, sep: [] });
                this.onKeyLine = true;
              }
              return;
            }
            default: {
              const bv = this.startBlockValue(map);
              if (bv) {
                if (bv.type === "block-seq") {
                  if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                    yield* this.pop({
                      type: "error",
                      offset: this.offset,
                      message: "Unexpected block-seq-ind on same line with key",
                      source: this.source
                    });
                    return;
                  }
                } else if (atMapIndent) {
                  map.items.push({ start });
                }
                this.stack.push(bv);
                return;
              }
            }
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *blockSequence(seq) {
        const it = seq.items[seq.items.length - 1];
        switch (this.type) {
          case "newline":
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                seq.items.push({ start: [this.sourceToken] });
            } else
              it.start.push(this.sourceToken);
            return;
          case "space":
          case "comment":
            if (it.value)
              seq.items.push({ start: [this.sourceToken] });
            else {
              if (this.atIndentedComment(it.start, seq.indent)) {
                const prev = seq.items[seq.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  seq.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
          case "anchor":
          case "tag":
            if (it.value || this.indent <= seq.indent)
              break;
            it.start.push(this.sourceToken);
            return;
          case "seq-item-ind":
            if (this.indent !== seq.indent)
              break;
            if (it.value || includesToken(it.start, "seq-item-ind"))
              seq.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
        }
        if (this.indent > seq.indent) {
          const bv = this.startBlockValue(seq);
          if (bv) {
            this.stack.push(bv);
            return;
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *flowCollection(fc) {
        const it = fc.items[fc.items.length - 1];
        if (this.type === "flow-error-end") {
          let top;
          do {
            yield* this.pop();
            top = this.peek(1);
          } while (top?.type === "flow-collection");
        } else if (fc.end.length === 0) {
          switch (this.type) {
            case "comma":
            case "explicit-key-ind":
              if (!it || it.sep)
                fc.items.push({ start: [this.sourceToken] });
              else
                it.start.push(this.sourceToken);
              return;
            case "map-value-ind":
              if (!it || it.value)
                fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              return;
            case "space":
            case "comment":
            case "newline":
            case "anchor":
            case "tag":
              if (!it || it.value)
                fc.items.push({ start: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                it.start.push(this.sourceToken);
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (!it || it.value)
                fc.items.push({ start: [], key: fs, sep: [] });
              else if (it.sep)
                this.stack.push(fs);
              else
                Object.assign(it, { key: fs, sep: [] });
              return;
            }
            case "flow-map-end":
            case "flow-seq-end":
              fc.end.push(this.sourceToken);
              return;
          }
          const bv = this.startBlockValue(fc);
          if (bv)
            this.stack.push(bv);
          else {
            yield* this.pop();
            yield* this.step();
          }
        } else {
          const parent = this.peek(2);
          if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
            yield* this.pop();
            yield* this.step();
          } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            fixFlowSeqItems(fc);
            const sep11 = fc.end.splice(1, fc.end.length);
            sep11.push(this.sourceToken);
            const map = {
              type: "block-map",
              offset: fc.offset,
              indent: fc.indent,
              items: [{ start, key: fc, sep: sep11 }]
            };
            this.onKeyLine = true;
            this.stack[this.stack.length - 1] = map;
          } else {
            yield* this.lineEnd(fc);
          }
        }
      }
      flowScalar(type) {
        if (this.onNewLine) {
          let nl = this.source.indexOf("\n") + 1;
          while (nl !== 0) {
            this.onNewLine(this.offset + nl);
            nl = this.source.indexOf("\n", nl) + 1;
          }
        }
        return {
          type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
      }
      startBlockValue(parent) {
        switch (this.type) {
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return this.flowScalar(this.type);
          case "block-scalar-header":
            return {
              type: "block-scalar",
              offset: this.offset,
              indent: this.indent,
              props: [this.sourceToken],
              source: ""
            };
          case "flow-map-start":
          case "flow-seq-start":
            return {
              type: "flow-collection",
              offset: this.offset,
              indent: this.indent,
              start: this.sourceToken,
              items: [],
              end: []
            };
          case "seq-item-ind":
            return {
              type: "block-seq",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken] }]
            };
          case "explicit-key-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            start.push(this.sourceToken);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, explicitKey: true }]
            };
          }
          case "map-value-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, key: null, sep: [this.sourceToken] }]
            };
          }
        }
        return null;
      }
      atIndentedComment(start, indent) {
        if (this.type !== "comment")
          return false;
        if (this.indent <= indent)
          return false;
        return start.every((st) => st.type === "newline" || st.type === "space");
      }
      *documentEnd(docEnd) {
        if (this.type !== "doc-mode") {
          if (docEnd.end)
            docEnd.end.push(this.sourceToken);
          else
            docEnd.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
        }
      }
      *lineEnd(token) {
        switch (this.type) {
          case "comma":
          case "doc-start":
          case "doc-end":
          case "flow-seq-end":
          case "flow-map-end":
          case "map-value-ind":
            yield* this.pop();
            yield* this.step();
            break;
          case "newline":
            this.onKeyLine = false;
          // fallthrough
          case "space":
          case "comment":
          default:
            if (token.end)
              token.end.push(this.sourceToken);
            else
              token.end = [this.sourceToken];
            if (this.type === "newline")
              yield* this.pop();
        }
      }
    };
    exports.Parser = Parser;
  }
});

// node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS({
  "node_modules/yaml/dist/public-api.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var errors = require_errors();
    var log = require_log();
    var identity = require_identity();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    function parseOptions(options) {
      const prettyErrors = options.prettyErrors !== false;
      const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter() || null;
      return { lineCounter: lineCounter$1, prettyErrors };
    }
    function parseAllDocuments(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      const docs = Array.from(composer$1.compose(parser$1.parse(source)));
      if (prettyErrors && lineCounter2)
        for (const doc of docs) {
          doc.errors.forEach(errors.prettifyError(source, lineCounter2));
          doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
        }
      if (docs.length > 0)
        return docs;
      return Object.assign([], { empty: true }, composer$1.streamInfo());
    }
    function parseDocument6(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      let doc = null;
      for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
        if (!doc)
          doc = _doc;
        else if (doc.options.logLevel !== "silent") {
          doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
          break;
        }
      }
      if (prettyErrors && lineCounter2) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
      }
      return doc;
    }
    function parse(src, reviver, options) {
      let _reviver = void 0;
      if (typeof reviver === "function") {
        _reviver = reviver;
      } else if (options === void 0 && reviver && typeof reviver === "object") {
        options = reviver;
      }
      const doc = parseDocument6(src, options);
      if (!doc)
        return null;
      doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
      if (doc.errors.length > 0) {
        if (doc.options.logLevel !== "silent")
          throw doc.errors[0];
        else
          doc.errors = [];
      }
      return doc.toJS(Object.assign({ reviver: _reviver }, options));
    }
    function stringify3(value, replacer, options) {
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === void 0 && replacer) {
        options = replacer;
      }
      if (typeof options === "string")
        options = options.length;
      if (typeof options === "number") {
        const indent = Math.round(options);
        options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
      }
      if (value === void 0) {
        const { keepUndefined } = options ?? replacer ?? {};
        if (!keepUndefined)
          return void 0;
      }
      if (identity.isDocument(value) && !_replacer)
        return value.toString(options);
      return new Document.Document(value, _replacer, options).toString(options);
    }
    exports.parse = parse;
    exports.parseAllDocuments = parseAllDocuments;
    exports.parseDocument = parseDocument6;
    exports.stringify = stringify3;
  }
});

// node_modules/yaml/dist/index.js
var require_dist = __commonJS({
  "node_modules/yaml/dist/index.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var Schema = require_Schema();
    var errors = require_errors();
    var Alias = require_Alias();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var cst = require_cst();
    var lexer = require_lexer();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    var publicApi = require_public_api();
    var visit = require_visit();
    exports.Composer = composer.Composer;
    exports.Document = Document.Document;
    exports.Schema = Schema.Schema;
    exports.YAMLError = errors.YAMLError;
    exports.YAMLParseError = errors.YAMLParseError;
    exports.YAMLWarning = errors.YAMLWarning;
    exports.Alias = Alias.Alias;
    exports.isAlias = identity.isAlias;
    exports.isCollection = identity.isCollection;
    exports.isDocument = identity.isDocument;
    exports.isMap = identity.isMap;
    exports.isNode = identity.isNode;
    exports.isPair = identity.isPair;
    exports.isScalar = identity.isScalar;
    exports.isSeq = identity.isSeq;
    exports.Pair = Pair.Pair;
    exports.Scalar = Scalar.Scalar;
    exports.YAMLMap = YAMLMap.YAMLMap;
    exports.YAMLSeq = YAMLSeq.YAMLSeq;
    exports.CST = cst;
    exports.Lexer = lexer.Lexer;
    exports.LineCounter = lineCounter.LineCounter;
    exports.Parser = parser.Parser;
    exports.parse = publicApi.parse;
    exports.parseAllDocuments = publicApi.parseAllDocuments;
    exports.parseDocument = publicApi.parseDocument;
    exports.stringify = publicApi.stringify;
    exports.visit = visit.visit;
    exports.visitAsync = visit.visitAsync;
  }
});

// node_modules/ajv/dist/compile/codegen/code.js
var require_code = __commonJS({
  "node_modules/ajv/dist/compile/codegen/code.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.regexpCode = exports.getEsmExportName = exports.getProperty = exports.safeStringify = exports.stringify = exports.strConcat = exports.addCodeArg = exports.str = exports._ = exports.nil = exports._Code = exports.Name = exports.IDENTIFIER = exports._CodeOrName = void 0;
    var _CodeOrName = class {
    };
    exports._CodeOrName = _CodeOrName;
    exports.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
    var Name = class extends _CodeOrName {
      constructor(s) {
        super();
        if (!exports.IDENTIFIER.test(s))
          throw new Error("CodeGen: name must be a valid identifier");
        this.str = s;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        return false;
      }
      get names() {
        return { [this.str]: 1 };
      }
    };
    exports.Name = Name;
    var _Code = class extends _CodeOrName {
      constructor(code) {
        super();
        this._items = typeof code === "string" ? [code] : code;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        if (this._items.length > 1)
          return false;
        const item = this._items[0];
        return item === "" || item === '""';
      }
      get str() {
        var _a;
        return (_a = this._str) !== null && _a !== void 0 ? _a : this._str = this._items.reduce((s, c) => `${s}${c}`, "");
      }
      get names() {
        var _a;
        return (_a = this._names) !== null && _a !== void 0 ? _a : this._names = this._items.reduce((names, c) => {
          if (c instanceof Name)
            names[c.str] = (names[c.str] || 0) + 1;
          return names;
        }, {});
      }
    };
    exports._Code = _Code;
    exports.nil = new _Code("");
    function _(strs, ...args) {
      const code = [strs[0]];
      let i = 0;
      while (i < args.length) {
        addCodeArg(code, args[i]);
        code.push(strs[++i]);
      }
      return new _Code(code);
    }
    exports._ = _;
    var plus = new _Code("+");
    function str(strs, ...args) {
      const expr = [safeStringify(strs[0])];
      let i = 0;
      while (i < args.length) {
        expr.push(plus);
        addCodeArg(expr, args[i]);
        expr.push(plus, safeStringify(strs[++i]));
      }
      optimize(expr);
      return new _Code(expr);
    }
    exports.str = str;
    function addCodeArg(code, arg) {
      if (arg instanceof _Code)
        code.push(...arg._items);
      else if (arg instanceof Name)
        code.push(arg);
      else
        code.push(interpolate(arg));
    }
    exports.addCodeArg = addCodeArg;
    function optimize(expr) {
      let i = 1;
      while (i < expr.length - 1) {
        if (expr[i] === plus) {
          const res = mergeExprItems(expr[i - 1], expr[i + 1]);
          if (res !== void 0) {
            expr.splice(i - 1, 3, res);
            continue;
          }
          expr[i++] = "+";
        }
        i++;
      }
    }
    function mergeExprItems(a, b) {
      if (b === '""')
        return a;
      if (a === '""')
        return b;
      if (typeof a == "string") {
        if (b instanceof Name || a[a.length - 1] !== '"')
          return;
        if (typeof b != "string")
          return `${a.slice(0, -1)}${b}"`;
        if (b[0] === '"')
          return a.slice(0, -1) + b.slice(1);
        return;
      }
      if (typeof b == "string" && b[0] === '"' && !(a instanceof Name))
        return `"${a}${b.slice(1)}`;
      return;
    }
    function strConcat(c1, c2) {
      return c2.emptyStr() ? c1 : c1.emptyStr() ? c2 : str`${c1}${c2}`;
    }
    exports.strConcat = strConcat;
    function interpolate(x) {
      return typeof x == "number" || typeof x == "boolean" || x === null ? x : safeStringify(Array.isArray(x) ? x.join(",") : x);
    }
    function stringify3(x) {
      return new _Code(safeStringify(x));
    }
    exports.stringify = stringify3;
    function safeStringify(x) {
      return JSON.stringify(x).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    }
    exports.safeStringify = safeStringify;
    function getProperty(key) {
      return typeof key == "string" && exports.IDENTIFIER.test(key) ? new _Code(`.${key}`) : _`[${key}]`;
    }
    exports.getProperty = getProperty;
    function getEsmExportName(key) {
      if (typeof key == "string" && exports.IDENTIFIER.test(key)) {
        return new _Code(`${key}`);
      }
      throw new Error(`CodeGen: invalid export name: ${key}, use explicit $id name mapping`);
    }
    exports.getEsmExportName = getEsmExportName;
    function regexpCode(rx) {
      return new _Code(rx.toString());
    }
    exports.regexpCode = regexpCode;
  }
});

// node_modules/ajv/dist/compile/codegen/scope.js
var require_scope = __commonJS({
  "node_modules/ajv/dist/compile/codegen/scope.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ValueScope = exports.ValueScopeName = exports.Scope = exports.varKinds = exports.UsedValueState = void 0;
    var code_1 = require_code();
    var ValueError = class extends Error {
      constructor(name) {
        super(`CodeGen: "code" for ${name} not defined`);
        this.value = name.value;
      }
    };
    var UsedValueState;
    (function(UsedValueState2) {
      UsedValueState2[UsedValueState2["Started"] = 0] = "Started";
      UsedValueState2[UsedValueState2["Completed"] = 1] = "Completed";
    })(UsedValueState || (exports.UsedValueState = UsedValueState = {}));
    exports.varKinds = {
      const: new code_1.Name("const"),
      let: new code_1.Name("let"),
      var: new code_1.Name("var")
    };
    var Scope = class {
      constructor({ prefixes, parent } = {}) {
        this._names = {};
        this._prefixes = prefixes;
        this._parent = parent;
      }
      toName(nameOrPrefix) {
        return nameOrPrefix instanceof code_1.Name ? nameOrPrefix : this.name(nameOrPrefix);
      }
      name(prefix) {
        return new code_1.Name(this._newName(prefix));
      }
      _newName(prefix) {
        const ng = this._names[prefix] || this._nameGroup(prefix);
        return `${prefix}${ng.index++}`;
      }
      _nameGroup(prefix) {
        var _a, _b;
        if (((_b = (_a = this._parent) === null || _a === void 0 ? void 0 : _a._prefixes) === null || _b === void 0 ? void 0 : _b.has(prefix)) || this._prefixes && !this._prefixes.has(prefix)) {
          throw new Error(`CodeGen: prefix "${prefix}" is not allowed in this scope`);
        }
        return this._names[prefix] = { prefix, index: 0 };
      }
    };
    exports.Scope = Scope;
    var ValueScopeName = class extends code_1.Name {
      constructor(prefix, nameStr) {
        super(nameStr);
        this.prefix = prefix;
      }
      setValue(value, { property, itemIndex }) {
        this.value = value;
        this.scopePath = (0, code_1._)`.${new code_1.Name(property)}[${itemIndex}]`;
      }
    };
    exports.ValueScopeName = ValueScopeName;
    var line = (0, code_1._)`\n`;
    var ValueScope = class extends Scope {
      constructor(opts) {
        super(opts);
        this._values = {};
        this._scope = opts.scope;
        this.opts = { ...opts, _n: opts.lines ? line : code_1.nil };
      }
      get() {
        return this._scope;
      }
      name(prefix) {
        return new ValueScopeName(prefix, this._newName(prefix));
      }
      value(nameOrPrefix, value) {
        var _a;
        if (value.ref === void 0)
          throw new Error("CodeGen: ref must be passed in value");
        const name = this.toName(nameOrPrefix);
        const { prefix } = name;
        const valueKey = (_a = value.key) !== null && _a !== void 0 ? _a : value.ref;
        let vs = this._values[prefix];
        if (vs) {
          const _name = vs.get(valueKey);
          if (_name)
            return _name;
        } else {
          vs = this._values[prefix] = /* @__PURE__ */ new Map();
        }
        vs.set(valueKey, name);
        const s = this._scope[prefix] || (this._scope[prefix] = []);
        const itemIndex = s.length;
        s[itemIndex] = value.ref;
        name.setValue(value, { property: prefix, itemIndex });
        return name;
      }
      getValue(prefix, keyOrRef) {
        const vs = this._values[prefix];
        if (!vs)
          return;
        return vs.get(keyOrRef);
      }
      scopeRefs(scopeName, values = this._values) {
        return this._reduceValues(values, (name) => {
          if (name.scopePath === void 0)
            throw new Error(`CodeGen: name "${name}" has no value`);
          return (0, code_1._)`${scopeName}${name.scopePath}`;
        });
      }
      scopeCode(values = this._values, usedValues, getCode) {
        return this._reduceValues(values, (name) => {
          if (name.value === void 0)
            throw new Error(`CodeGen: name "${name}" has no value`);
          return name.value.code;
        }, usedValues, getCode);
      }
      _reduceValues(values, valueCode, usedValues = {}, getCode) {
        let code = code_1.nil;
        for (const prefix in values) {
          const vs = values[prefix];
          if (!vs)
            continue;
          const nameSet = usedValues[prefix] = usedValues[prefix] || /* @__PURE__ */ new Map();
          vs.forEach((name) => {
            if (nameSet.has(name))
              return;
            nameSet.set(name, UsedValueState.Started);
            let c = valueCode(name);
            if (c) {
              const def = this.opts.es5 ? exports.varKinds.var : exports.varKinds.const;
              code = (0, code_1._)`${code}${def} ${name} = ${c};${this.opts._n}`;
            } else if (c = getCode === null || getCode === void 0 ? void 0 : getCode(name)) {
              code = (0, code_1._)`${code}${c}${this.opts._n}`;
            } else {
              throw new ValueError(name);
            }
            nameSet.set(name, UsedValueState.Completed);
          });
        }
        return code;
      }
    };
    exports.ValueScope = ValueScope;
  }
});

// node_modules/ajv/dist/compile/codegen/index.js
var require_codegen = __commonJS({
  "node_modules/ajv/dist/compile/codegen/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.or = exports.and = exports.not = exports.CodeGen = exports.operators = exports.varKinds = exports.ValueScopeName = exports.ValueScope = exports.Scope = exports.Name = exports.regexpCode = exports.stringify = exports.getProperty = exports.nil = exports.strConcat = exports.str = exports._ = void 0;
    var code_1 = require_code();
    var scope_1 = require_scope();
    var code_2 = require_code();
    Object.defineProperty(exports, "_", { enumerable: true, get: function() {
      return code_2._;
    } });
    Object.defineProperty(exports, "str", { enumerable: true, get: function() {
      return code_2.str;
    } });
    Object.defineProperty(exports, "strConcat", { enumerable: true, get: function() {
      return code_2.strConcat;
    } });
    Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
      return code_2.nil;
    } });
    Object.defineProperty(exports, "getProperty", { enumerable: true, get: function() {
      return code_2.getProperty;
    } });
    Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
      return code_2.stringify;
    } });
    Object.defineProperty(exports, "regexpCode", { enumerable: true, get: function() {
      return code_2.regexpCode;
    } });
    Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
      return code_2.Name;
    } });
    var scope_2 = require_scope();
    Object.defineProperty(exports, "Scope", { enumerable: true, get: function() {
      return scope_2.Scope;
    } });
    Object.defineProperty(exports, "ValueScope", { enumerable: true, get: function() {
      return scope_2.ValueScope;
    } });
    Object.defineProperty(exports, "ValueScopeName", { enumerable: true, get: function() {
      return scope_2.ValueScopeName;
    } });
    Object.defineProperty(exports, "varKinds", { enumerable: true, get: function() {
      return scope_2.varKinds;
    } });
    exports.operators = {
      GT: new code_1._Code(">"),
      GTE: new code_1._Code(">="),
      LT: new code_1._Code("<"),
      LTE: new code_1._Code("<="),
      EQ: new code_1._Code("==="),
      NEQ: new code_1._Code("!=="),
      NOT: new code_1._Code("!"),
      OR: new code_1._Code("||"),
      AND: new code_1._Code("&&"),
      ADD: new code_1._Code("+")
    };
    var Node = class {
      optimizeNodes() {
        return this;
      }
      optimizeNames(_names, _constants) {
        return this;
      }
    };
    var Def = class extends Node {
      constructor(varKind, name, rhs) {
        super();
        this.varKind = varKind;
        this.name = name;
        this.rhs = rhs;
      }
      render({ es5, _n }) {
        const varKind = es5 ? scope_1.varKinds.var : this.varKind;
        const rhs = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
        return `${varKind} ${this.name}${rhs};` + _n;
      }
      optimizeNames(names, constants) {
        if (!names[this.name.str])
          return;
        if (this.rhs)
          this.rhs = optimizeExpr(this.rhs, names, constants);
        return this;
      }
      get names() {
        return this.rhs instanceof code_1._CodeOrName ? this.rhs.names : {};
      }
    };
    var Assign = class extends Node {
      constructor(lhs, rhs, sideEffects) {
        super();
        this.lhs = lhs;
        this.rhs = rhs;
        this.sideEffects = sideEffects;
      }
      render({ _n }) {
        return `${this.lhs} = ${this.rhs};` + _n;
      }
      optimizeNames(names, constants) {
        if (this.lhs instanceof code_1.Name && !names[this.lhs.str] && !this.sideEffects)
          return;
        this.rhs = optimizeExpr(this.rhs, names, constants);
        return this;
      }
      get names() {
        const names = this.lhs instanceof code_1.Name ? {} : { ...this.lhs.names };
        return addExprNames(names, this.rhs);
      }
    };
    var AssignOp = class extends Assign {
      constructor(lhs, op, rhs, sideEffects) {
        super(lhs, rhs, sideEffects);
        this.op = op;
      }
      render({ _n }) {
        return `${this.lhs} ${this.op}= ${this.rhs};` + _n;
      }
    };
    var Label = class extends Node {
      constructor(label) {
        super();
        this.label = label;
        this.names = {};
      }
      render({ _n }) {
        return `${this.label}:` + _n;
      }
    };
    var Break = class extends Node {
      constructor(label) {
        super();
        this.label = label;
        this.names = {};
      }
      render({ _n }) {
        const label = this.label ? ` ${this.label}` : "";
        return `break${label};` + _n;
      }
    };
    var Throw = class extends Node {
      constructor(error) {
        super();
        this.error = error;
      }
      render({ _n }) {
        return `throw ${this.error};` + _n;
      }
      get names() {
        return this.error.names;
      }
    };
    var AnyCode = class extends Node {
      constructor(code) {
        super();
        this.code = code;
      }
      render({ _n }) {
        return `${this.code};` + _n;
      }
      optimizeNodes() {
        return `${this.code}` ? this : void 0;
      }
      optimizeNames(names, constants) {
        this.code = optimizeExpr(this.code, names, constants);
        return this;
      }
      get names() {
        return this.code instanceof code_1._CodeOrName ? this.code.names : {};
      }
    };
    var ParentNode = class extends Node {
      constructor(nodes = []) {
        super();
        this.nodes = nodes;
      }
      render(opts) {
        return this.nodes.reduce((code, n) => code + n.render(opts), "");
      }
      optimizeNodes() {
        const { nodes } = this;
        let i = nodes.length;
        while (i--) {
          const n = nodes[i].optimizeNodes();
          if (Array.isArray(n))
            nodes.splice(i, 1, ...n);
          else if (n)
            nodes[i] = n;
          else
            nodes.splice(i, 1);
        }
        return nodes.length > 0 ? this : void 0;
      }
      optimizeNames(names, constants) {
        const { nodes } = this;
        let i = nodes.length;
        while (i--) {
          const n = nodes[i];
          if (n.optimizeNames(names, constants))
            continue;
          subtractNames(names, n.names);
          nodes.splice(i, 1);
        }
        return nodes.length > 0 ? this : void 0;
      }
      get names() {
        return this.nodes.reduce((names, n) => addNames(names, n.names), {});
      }
    };
    var BlockNode = class extends ParentNode {
      render(opts) {
        return "{" + opts._n + super.render(opts) + "}" + opts._n;
      }
    };
    var Root = class extends ParentNode {
    };
    var Else = class extends BlockNode {
    };
    Else.kind = "else";
    var If = class _If extends BlockNode {
      constructor(condition, nodes) {
        super(nodes);
        this.condition = condition;
      }
      render(opts) {
        let code = `if(${this.condition})` + super.render(opts);
        if (this.else)
          code += "else " + this.else.render(opts);
        return code;
      }
      optimizeNodes() {
        super.optimizeNodes();
        const cond = this.condition;
        if (cond === true)
          return this.nodes;
        let e = this.else;
        if (e) {
          const ns = e.optimizeNodes();
          e = this.else = Array.isArray(ns) ? new Else(ns) : ns;
        }
        if (e) {
          if (cond === false)
            return e instanceof _If ? e : e.nodes;
          if (this.nodes.length)
            return this;
          return new _If(not(cond), e instanceof _If ? [e] : e.nodes);
        }
        if (cond === false || !this.nodes.length)
          return void 0;
        return this;
      }
      optimizeNames(names, constants) {
        var _a;
        this.else = (_a = this.else) === null || _a === void 0 ? void 0 : _a.optimizeNames(names, constants);
        if (!(super.optimizeNames(names, constants) || this.else))
          return;
        this.condition = optimizeExpr(this.condition, names, constants);
        return this;
      }
      get names() {
        const names = super.names;
        addExprNames(names, this.condition);
        if (this.else)
          addNames(names, this.else.names);
        return names;
      }
    };
    If.kind = "if";
    var For = class extends BlockNode {
    };
    For.kind = "for";
    var ForLoop = class extends For {
      constructor(iteration) {
        super();
        this.iteration = iteration;
      }
      render(opts) {
        return `for(${this.iteration})` + super.render(opts);
      }
      optimizeNames(names, constants) {
        if (!super.optimizeNames(names, constants))
          return;
        this.iteration = optimizeExpr(this.iteration, names, constants);
        return this;
      }
      get names() {
        return addNames(super.names, this.iteration.names);
      }
    };
    var ForRange = class extends For {
      constructor(varKind, name, from, to) {
        super();
        this.varKind = varKind;
        this.name = name;
        this.from = from;
        this.to = to;
      }
      render(opts) {
        const varKind = opts.es5 ? scope_1.varKinds.var : this.varKind;
        const { name, from, to } = this;
        return `for(${varKind} ${name}=${from}; ${name}<${to}; ${name}++)` + super.render(opts);
      }
      get names() {
        const names = addExprNames(super.names, this.from);
        return addExprNames(names, this.to);
      }
    };
    var ForIter = class extends For {
      constructor(loop, varKind, name, iterable) {
        super();
        this.loop = loop;
        this.varKind = varKind;
        this.name = name;
        this.iterable = iterable;
      }
      render(opts) {
        return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(opts);
      }
      optimizeNames(names, constants) {
        if (!super.optimizeNames(names, constants))
          return;
        this.iterable = optimizeExpr(this.iterable, names, constants);
        return this;
      }
      get names() {
        return addNames(super.names, this.iterable.names);
      }
    };
    var Func = class extends BlockNode {
      constructor(name, args, async) {
        super();
        this.name = name;
        this.args = args;
        this.async = async;
      }
      render(opts) {
        const _async = this.async ? "async " : "";
        return `${_async}function ${this.name}(${this.args})` + super.render(opts);
      }
    };
    Func.kind = "func";
    var Return = class extends ParentNode {
      render(opts) {
        return "return " + super.render(opts);
      }
    };
    Return.kind = "return";
    var Try = class extends BlockNode {
      render(opts) {
        let code = "try" + super.render(opts);
        if (this.catch)
          code += this.catch.render(opts);
        if (this.finally)
          code += this.finally.render(opts);
        return code;
      }
      optimizeNodes() {
        var _a, _b;
        super.optimizeNodes();
        (_a = this.catch) === null || _a === void 0 ? void 0 : _a.optimizeNodes();
        (_b = this.finally) === null || _b === void 0 ? void 0 : _b.optimizeNodes();
        return this;
      }
      optimizeNames(names, constants) {
        var _a, _b;
        super.optimizeNames(names, constants);
        (_a = this.catch) === null || _a === void 0 ? void 0 : _a.optimizeNames(names, constants);
        (_b = this.finally) === null || _b === void 0 ? void 0 : _b.optimizeNames(names, constants);
        return this;
      }
      get names() {
        const names = super.names;
        if (this.catch)
          addNames(names, this.catch.names);
        if (this.finally)
          addNames(names, this.finally.names);
        return names;
      }
    };
    var Catch = class extends BlockNode {
      constructor(error) {
        super();
        this.error = error;
      }
      render(opts) {
        return `catch(${this.error})` + super.render(opts);
      }
    };
    Catch.kind = "catch";
    var Finally = class extends BlockNode {
      render(opts) {
        return "finally" + super.render(opts);
      }
    };
    Finally.kind = "finally";
    var CodeGen = class {
      constructor(extScope, opts = {}) {
        this._values = {};
        this._blockStarts = [];
        this._constants = {};
        this.opts = { ...opts, _n: opts.lines ? "\n" : "" };
        this._extScope = extScope;
        this._scope = new scope_1.Scope({ parent: extScope });
        this._nodes = [new Root()];
      }
      toString() {
        return this._root.render(this.opts);
      }
      // returns unique name in the internal scope
      name(prefix) {
        return this._scope.name(prefix);
      }
      // reserves unique name in the external scope
      scopeName(prefix) {
        return this._extScope.name(prefix);
      }
      // reserves unique name in the external scope and assigns value to it
      scopeValue(prefixOrName, value) {
        const name = this._extScope.value(prefixOrName, value);
        const vs = this._values[name.prefix] || (this._values[name.prefix] = /* @__PURE__ */ new Set());
        vs.add(name);
        return name;
      }
      getScopeValue(prefix, keyOrRef) {
        return this._extScope.getValue(prefix, keyOrRef);
      }
      // return code that assigns values in the external scope to the names that are used internally
      // (same names that were returned by gen.scopeName or gen.scopeValue)
      scopeRefs(scopeName) {
        return this._extScope.scopeRefs(scopeName, this._values);
      }
      scopeCode() {
        return this._extScope.scopeCode(this._values);
      }
      _def(varKind, nameOrPrefix, rhs, constant) {
        const name = this._scope.toName(nameOrPrefix);
        if (rhs !== void 0 && constant)
          this._constants[name.str] = rhs;
        this._leafNode(new Def(varKind, name, rhs));
        return name;
      }
      // `const` declaration (`var` in es5 mode)
      const(nameOrPrefix, rhs, _constant) {
        return this._def(scope_1.varKinds.const, nameOrPrefix, rhs, _constant);
      }
      // `let` declaration with optional assignment (`var` in es5 mode)
      let(nameOrPrefix, rhs, _constant) {
        return this._def(scope_1.varKinds.let, nameOrPrefix, rhs, _constant);
      }
      // `var` declaration with optional assignment
      var(nameOrPrefix, rhs, _constant) {
        return this._def(scope_1.varKinds.var, nameOrPrefix, rhs, _constant);
      }
      // assignment code
      assign(lhs, rhs, sideEffects) {
        return this._leafNode(new Assign(lhs, rhs, sideEffects));
      }
      // `+=` code
      add(lhs, rhs) {
        return this._leafNode(new AssignOp(lhs, exports.operators.ADD, rhs));
      }
      // appends passed SafeExpr to code or executes Block
      code(c) {
        if (typeof c == "function")
          c();
        else if (c !== code_1.nil)
          this._leafNode(new AnyCode(c));
        return this;
      }
      // returns code for object literal for the passed argument list of key-value pairs
      object(...keyValues) {
        const code = ["{"];
        for (const [key, value] of keyValues) {
          if (code.length > 1)
            code.push(",");
          code.push(key);
          if (key !== value || this.opts.es5) {
            code.push(":");
            (0, code_1.addCodeArg)(code, value);
          }
        }
        code.push("}");
        return new code_1._Code(code);
      }
      // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
      if(condition, thenBody, elseBody) {
        this._blockNode(new If(condition));
        if (thenBody && elseBody) {
          this.code(thenBody).else().code(elseBody).endIf();
        } else if (thenBody) {
          this.code(thenBody).endIf();
        } else if (elseBody) {
          throw new Error('CodeGen: "else" body without "then" body');
        }
        return this;
      }
      // `else if` clause - invalid without `if` or after `else` clauses
      elseIf(condition) {
        return this._elseNode(new If(condition));
      }
      // `else` clause - only valid after `if` or `else if` clauses
      else() {
        return this._elseNode(new Else());
      }
      // end `if` statement (needed if gen.if was used only with condition)
      endIf() {
        return this._endBlockNode(If, Else);
      }
      _for(node, forBody) {
        this._blockNode(node);
        if (forBody)
          this.code(forBody).endFor();
        return this;
      }
      // a generic `for` clause (or statement if `forBody` is passed)
      for(iteration, forBody) {
        return this._for(new ForLoop(iteration), forBody);
      }
      // `for` statement for a range of values
      forRange(nameOrPrefix, from, to, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.let) {
        const name = this._scope.toName(nameOrPrefix);
        return this._for(new ForRange(varKind, name, from, to), () => forBody(name));
      }
      // `for-of` statement (in es5 mode replace with a normal for loop)
      forOf(nameOrPrefix, iterable, forBody, varKind = scope_1.varKinds.const) {
        const name = this._scope.toName(nameOrPrefix);
        if (this.opts.es5) {
          const arr = iterable instanceof code_1.Name ? iterable : this.var("_arr", iterable);
          return this.forRange("_i", 0, (0, code_1._)`${arr}.length`, (i) => {
            this.var(name, (0, code_1._)`${arr}[${i}]`);
            forBody(name);
          });
        }
        return this._for(new ForIter("of", varKind, name, iterable), () => forBody(name));
      }
      // `for-in` statement.
      // With option `ownProperties` replaced with a `for-of` loop for object keys
      forIn(nameOrPrefix, obj, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.const) {
        if (this.opts.ownProperties) {
          return this.forOf(nameOrPrefix, (0, code_1._)`Object.keys(${obj})`, forBody);
        }
        const name = this._scope.toName(nameOrPrefix);
        return this._for(new ForIter("in", varKind, name, obj), () => forBody(name));
      }
      // end `for` loop
      endFor() {
        return this._endBlockNode(For);
      }
      // `label` statement
      label(label) {
        return this._leafNode(new Label(label));
      }
      // `break` statement
      break(label) {
        return this._leafNode(new Break(label));
      }
      // `return` statement
      return(value) {
        const node = new Return();
        this._blockNode(node);
        this.code(value);
        if (node.nodes.length !== 1)
          throw new Error('CodeGen: "return" should have one node');
        return this._endBlockNode(Return);
      }
      // `try` statement
      try(tryBody, catchCode, finallyCode) {
        if (!catchCode && !finallyCode)
          throw new Error('CodeGen: "try" without "catch" and "finally"');
        const node = new Try();
        this._blockNode(node);
        this.code(tryBody);
        if (catchCode) {
          const error = this.name("e");
          this._currNode = node.catch = new Catch(error);
          catchCode(error);
        }
        if (finallyCode) {
          this._currNode = node.finally = new Finally();
          this.code(finallyCode);
        }
        return this._endBlockNode(Catch, Finally);
      }
      // `throw` statement
      throw(error) {
        return this._leafNode(new Throw(error));
      }
      // start self-balancing block
      block(body, nodeCount) {
        this._blockStarts.push(this._nodes.length);
        if (body)
          this.code(body).endBlock(nodeCount);
        return this;
      }
      // end the current self-balancing block
      endBlock(nodeCount) {
        const len = this._blockStarts.pop();
        if (len === void 0)
          throw new Error("CodeGen: not in self-balancing block");
        const toClose = this._nodes.length - len;
        if (toClose < 0 || nodeCount !== void 0 && toClose !== nodeCount) {
          throw new Error(`CodeGen: wrong number of nodes: ${toClose} vs ${nodeCount} expected`);
        }
        this._nodes.length = len;
        return this;
      }
      // `function` heading (or definition if funcBody is passed)
      func(name, args = code_1.nil, async, funcBody) {
        this._blockNode(new Func(name, args, async));
        if (funcBody)
          this.code(funcBody).endFunc();
        return this;
      }
      // end function definition
      endFunc() {
        return this._endBlockNode(Func);
      }
      optimize(n = 1) {
        while (n-- > 0) {
          this._root.optimizeNodes();
          this._root.optimizeNames(this._root.names, this._constants);
        }
      }
      _leafNode(node) {
        this._currNode.nodes.push(node);
        return this;
      }
      _blockNode(node) {
        this._currNode.nodes.push(node);
        this._nodes.push(node);
      }
      _endBlockNode(N1, N2) {
        const n = this._currNode;
        if (n instanceof N1 || N2 && n instanceof N2) {
          this._nodes.pop();
          return this;
        }
        throw new Error(`CodeGen: not in block "${N2 ? `${N1.kind}/${N2.kind}` : N1.kind}"`);
      }
      _elseNode(node) {
        const n = this._currNode;
        if (!(n instanceof If)) {
          throw new Error('CodeGen: "else" without "if"');
        }
        this._currNode = n.else = node;
        return this;
      }
      get _root() {
        return this._nodes[0];
      }
      get _currNode() {
        const ns = this._nodes;
        return ns[ns.length - 1];
      }
      set _currNode(node) {
        const ns = this._nodes;
        ns[ns.length - 1] = node;
      }
    };
    exports.CodeGen = CodeGen;
    function addNames(names, from) {
      for (const n in from)
        names[n] = (names[n] || 0) + (from[n] || 0);
      return names;
    }
    function addExprNames(names, from) {
      return from instanceof code_1._CodeOrName ? addNames(names, from.names) : names;
    }
    function optimizeExpr(expr, names, constants) {
      if (expr instanceof code_1.Name)
        return replaceName(expr);
      if (!canOptimize(expr))
        return expr;
      return new code_1._Code(expr._items.reduce((items, c) => {
        if (c instanceof code_1.Name)
          c = replaceName(c);
        if (c instanceof code_1._Code)
          items.push(...c._items);
        else
          items.push(c);
        return items;
      }, []));
      function replaceName(n) {
        const c = constants[n.str];
        if (c === void 0 || names[n.str] !== 1)
          return n;
        delete names[n.str];
        return c;
      }
      function canOptimize(e) {
        return e instanceof code_1._Code && e._items.some((c) => c instanceof code_1.Name && names[c.str] === 1 && constants[c.str] !== void 0);
      }
    }
    function subtractNames(names, from) {
      for (const n in from)
        names[n] = (names[n] || 0) - (from[n] || 0);
    }
    function not(x) {
      return typeof x == "boolean" || typeof x == "number" || x === null ? !x : (0, code_1._)`!${par(x)}`;
    }
    exports.not = not;
    var andCode = mappend(exports.operators.AND);
    function and(...args) {
      return args.reduce(andCode);
    }
    exports.and = and;
    var orCode = mappend(exports.operators.OR);
    function or(...args) {
      return args.reduce(orCode);
    }
    exports.or = or;
    function mappend(op) {
      return (x, y) => x === code_1.nil ? y : y === code_1.nil ? x : (0, code_1._)`${par(x)} ${op} ${par(y)}`;
    }
    function par(x) {
      return x instanceof code_1.Name ? x : (0, code_1._)`(${x})`;
    }
  }
});

// node_modules/ajv/dist/compile/util.js
var require_util = __commonJS({
  "node_modules/ajv/dist/compile/util.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.checkStrictMode = exports.getErrorPath = exports.Type = exports.useFunc = exports.setEvaluated = exports.evaluatedPropsToName = exports.mergeEvaluated = exports.eachItem = exports.unescapeJsonPointer = exports.escapeJsonPointer = exports.escapeFragment = exports.unescapeFragment = exports.schemaRefOrVal = exports.schemaHasRulesButRef = exports.schemaHasRules = exports.checkUnknownRules = exports.alwaysValidSchema = exports.toHash = void 0;
    var codegen_1 = require_codegen();
    var code_1 = require_code();
    function toHash(arr) {
      const hash = {};
      for (const item of arr)
        hash[item] = true;
      return hash;
    }
    exports.toHash = toHash;
    function alwaysValidSchema(it, schema) {
      if (typeof schema == "boolean")
        return schema;
      if (Object.keys(schema).length === 0)
        return true;
      checkUnknownRules(it, schema);
      return !schemaHasRules(schema, it.self.RULES.all);
    }
    exports.alwaysValidSchema = alwaysValidSchema;
    function checkUnknownRules(it, schema = it.schema) {
      const { opts, self } = it;
      if (!opts.strictSchema)
        return;
      if (typeof schema === "boolean")
        return;
      const rules = self.RULES.keywords;
      for (const key in schema) {
        if (!rules[key])
          checkStrictMode(it, `unknown keyword: "${key}"`);
      }
    }
    exports.checkUnknownRules = checkUnknownRules;
    function schemaHasRules(schema, rules) {
      if (typeof schema == "boolean")
        return !schema;
      for (const key in schema)
        if (rules[key])
          return true;
      return false;
    }
    exports.schemaHasRules = schemaHasRules;
    function schemaHasRulesButRef(schema, RULES) {
      if (typeof schema == "boolean")
        return !schema;
      for (const key in schema)
        if (key !== "$ref" && RULES.all[key])
          return true;
      return false;
    }
    exports.schemaHasRulesButRef = schemaHasRulesButRef;
    function schemaRefOrVal({ topSchemaRef, schemaPath }, schema, keyword, $data) {
      if (!$data) {
        if (typeof schema == "number" || typeof schema == "boolean")
          return schema;
        if (typeof schema == "string")
          return (0, codegen_1._)`${schema}`;
      }
      return (0, codegen_1._)`${topSchemaRef}${schemaPath}${(0, codegen_1.getProperty)(keyword)}`;
    }
    exports.schemaRefOrVal = schemaRefOrVal;
    function unescapeFragment(str) {
      return unescapeJsonPointer(decodeURIComponent(str));
    }
    exports.unescapeFragment = unescapeFragment;
    function escapeFragment(str) {
      return encodeURIComponent(escapeJsonPointer(str));
    }
    exports.escapeFragment = escapeFragment;
    function escapeJsonPointer(str) {
      if (typeof str == "number")
        return `${str}`;
      return str.replace(/~/g, "~0").replace(/\//g, "~1");
    }
    exports.escapeJsonPointer = escapeJsonPointer;
    function unescapeJsonPointer(str) {
      return str.replace(/~1/g, "/").replace(/~0/g, "~");
    }
    exports.unescapeJsonPointer = unescapeJsonPointer;
    function eachItem(xs, f) {
      if (Array.isArray(xs)) {
        for (const x of xs)
          f(x);
      } else {
        f(xs);
      }
    }
    exports.eachItem = eachItem;
    function makeMergeEvaluated({ mergeNames, mergeToName, mergeValues, resultToName }) {
      return (gen, from, to, toName) => {
        const res = to === void 0 ? from : to instanceof codegen_1.Name ? (from instanceof codegen_1.Name ? mergeNames(gen, from, to) : mergeToName(gen, from, to), to) : from instanceof codegen_1.Name ? (mergeToName(gen, to, from), from) : mergeValues(from, to);
        return toName === codegen_1.Name && !(res instanceof codegen_1.Name) ? resultToName(gen, res) : res;
      };
    }
    exports.mergeEvaluated = {
      props: makeMergeEvaluated({
        mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => {
          gen.if((0, codegen_1._)`${from} === true`, () => gen.assign(to, true), () => gen.assign(to, (0, codegen_1._)`${to} || {}`).code((0, codegen_1._)`Object.assign(${to}, ${from})`));
        }),
        mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => {
          if (from === true) {
            gen.assign(to, true);
          } else {
            gen.assign(to, (0, codegen_1._)`${to} || {}`);
            setEvaluated(gen, to, from);
          }
        }),
        mergeValues: (from, to) => from === true ? true : { ...from, ...to },
        resultToName: evaluatedPropsToName
      }),
      items: makeMergeEvaluated({
        mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => gen.assign(to, (0, codegen_1._)`${from} === true ? true : ${to} > ${from} ? ${to} : ${from}`)),
        mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => gen.assign(to, from === true ? true : (0, codegen_1._)`${to} > ${from} ? ${to} : ${from}`)),
        mergeValues: (from, to) => from === true ? true : Math.max(from, to),
        resultToName: (gen, items) => gen.var("items", items)
      })
    };
    function evaluatedPropsToName(gen, ps) {
      if (ps === true)
        return gen.var("props", true);
      const props = gen.var("props", (0, codegen_1._)`{}`);
      if (ps !== void 0)
        setEvaluated(gen, props, ps);
      return props;
    }
    exports.evaluatedPropsToName = evaluatedPropsToName;
    function setEvaluated(gen, props, ps) {
      Object.keys(ps).forEach((p) => gen.assign((0, codegen_1._)`${props}${(0, codegen_1.getProperty)(p)}`, true));
    }
    exports.setEvaluated = setEvaluated;
    var snippets = {};
    function useFunc(gen, f) {
      return gen.scopeValue("func", {
        ref: f,
        code: snippets[f.code] || (snippets[f.code] = new code_1._Code(f.code))
      });
    }
    exports.useFunc = useFunc;
    var Type;
    (function(Type2) {
      Type2[Type2["Num"] = 0] = "Num";
      Type2[Type2["Str"] = 1] = "Str";
    })(Type || (exports.Type = Type = {}));
    function getErrorPath(dataProp, dataPropType, jsPropertySyntax) {
      if (dataProp instanceof codegen_1.Name) {
        const isNumber = dataPropType === Type.Num;
        return jsPropertySyntax ? isNumber ? (0, codegen_1._)`"[" + ${dataProp} + "]"` : (0, codegen_1._)`"['" + ${dataProp} + "']"` : isNumber ? (0, codegen_1._)`"/" + ${dataProp}` : (0, codegen_1._)`"/" + ${dataProp}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
      }
      return jsPropertySyntax ? (0, codegen_1.getProperty)(dataProp).toString() : "/" + escapeJsonPointer(dataProp);
    }
    exports.getErrorPath = getErrorPath;
    function checkStrictMode(it, msg, mode = it.opts.strictSchema) {
      if (!mode)
        return;
      msg = `strict mode: ${msg}`;
      if (mode === true)
        throw new Error(msg);
      it.self.logger.warn(msg);
    }
    exports.checkStrictMode = checkStrictMode;
  }
});

// node_modules/ajv/dist/compile/names.js
var require_names = __commonJS({
  "node_modules/ajv/dist/compile/names.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var names = {
      // validation function arguments
      data: new codegen_1.Name("data"),
      // data passed to validation function
      // args passed from referencing schema
      valCxt: new codegen_1.Name("valCxt"),
      // validation/data context - should not be used directly, it is destructured to the names below
      instancePath: new codegen_1.Name("instancePath"),
      parentData: new codegen_1.Name("parentData"),
      parentDataProperty: new codegen_1.Name("parentDataProperty"),
      rootData: new codegen_1.Name("rootData"),
      // root data - same as the data passed to the first/top validation function
      dynamicAnchors: new codegen_1.Name("dynamicAnchors"),
      // used to support recursiveRef and dynamicRef
      // function scoped variables
      vErrors: new codegen_1.Name("vErrors"),
      // null or array of validation errors
      errors: new codegen_1.Name("errors"),
      // counter of validation errors
      this: new codegen_1.Name("this"),
      // "globals"
      self: new codegen_1.Name("self"),
      scope: new codegen_1.Name("scope"),
      // JTD serialize/parse name for JSON string and position
      json: new codegen_1.Name("json"),
      jsonPos: new codegen_1.Name("jsonPos"),
      jsonLen: new codegen_1.Name("jsonLen"),
      jsonPart: new codegen_1.Name("jsonPart")
    };
    exports.default = names;
  }
});

// node_modules/ajv/dist/compile/errors.js
var require_errors2 = __commonJS({
  "node_modules/ajv/dist/compile/errors.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.extendErrors = exports.resetErrorsCount = exports.reportExtraError = exports.reportError = exports.keyword$DataError = exports.keywordError = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var names_1 = require_names();
    exports.keywordError = {
      message: ({ keyword }) => (0, codegen_1.str)`must pass "${keyword}" keyword validation`
    };
    exports.keyword$DataError = {
      message: ({ keyword, schemaType }) => schemaType ? (0, codegen_1.str)`"${keyword}" keyword must be ${schemaType} ($data)` : (0, codegen_1.str)`"${keyword}" keyword is invalid ($data)`
    };
    function reportError(cxt, error = exports.keywordError, errorPaths, overrideAllErrors) {
      const { it } = cxt;
      const { gen, compositeRule, allErrors } = it;
      const errObj = errorObjectCode(cxt, error, errorPaths);
      if (overrideAllErrors !== null && overrideAllErrors !== void 0 ? overrideAllErrors : compositeRule || allErrors) {
        addError(gen, errObj);
      } else {
        returnErrors(it, (0, codegen_1._)`[${errObj}]`);
      }
    }
    exports.reportError = reportError;
    function reportExtraError(cxt, error = exports.keywordError, errorPaths) {
      const { it } = cxt;
      const { gen, compositeRule, allErrors } = it;
      const errObj = errorObjectCode(cxt, error, errorPaths);
      addError(gen, errObj);
      if (!(compositeRule || allErrors)) {
        returnErrors(it, names_1.default.vErrors);
      }
    }
    exports.reportExtraError = reportExtraError;
    function resetErrorsCount(gen, errsCount) {
      gen.assign(names_1.default.errors, errsCount);
      gen.if((0, codegen_1._)`${names_1.default.vErrors} !== null`, () => gen.if(errsCount, () => gen.assign((0, codegen_1._)`${names_1.default.vErrors}.length`, errsCount), () => gen.assign(names_1.default.vErrors, null)));
    }
    exports.resetErrorsCount = resetErrorsCount;
    function extendErrors({ gen, keyword, schemaValue, data, errsCount, it }) {
      if (errsCount === void 0)
        throw new Error("ajv implementation error");
      const err = gen.name("err");
      gen.forRange("i", errsCount, names_1.default.errors, (i) => {
        gen.const(err, (0, codegen_1._)`${names_1.default.vErrors}[${i}]`);
        gen.if((0, codegen_1._)`${err}.instancePath === undefined`, () => gen.assign((0, codegen_1._)`${err}.instancePath`, (0, codegen_1.strConcat)(names_1.default.instancePath, it.errorPath)));
        gen.assign((0, codegen_1._)`${err}.schemaPath`, (0, codegen_1.str)`${it.errSchemaPath}/${keyword}`);
        if (it.opts.verbose) {
          gen.assign((0, codegen_1._)`${err}.schema`, schemaValue);
          gen.assign((0, codegen_1._)`${err}.data`, data);
        }
      });
    }
    exports.extendErrors = extendErrors;
    function addError(gen, errObj) {
      const err = gen.const("err", errObj);
      gen.if((0, codegen_1._)`${names_1.default.vErrors} === null`, () => gen.assign(names_1.default.vErrors, (0, codegen_1._)`[${err}]`), (0, codegen_1._)`${names_1.default.vErrors}.push(${err})`);
      gen.code((0, codegen_1._)`${names_1.default.errors}++`);
    }
    function returnErrors(it, errs) {
      const { gen, validateName, schemaEnv } = it;
      if (schemaEnv.$async) {
        gen.throw((0, codegen_1._)`new ${it.ValidationError}(${errs})`);
      } else {
        gen.assign((0, codegen_1._)`${validateName}.errors`, errs);
        gen.return(false);
      }
    }
    var E = {
      keyword: new codegen_1.Name("keyword"),
      schemaPath: new codegen_1.Name("schemaPath"),
      // also used in JTD errors
      params: new codegen_1.Name("params"),
      propertyName: new codegen_1.Name("propertyName"),
      message: new codegen_1.Name("message"),
      schema: new codegen_1.Name("schema"),
      parentSchema: new codegen_1.Name("parentSchema")
    };
    function errorObjectCode(cxt, error, errorPaths) {
      const { createErrors } = cxt.it;
      if (createErrors === false)
        return (0, codegen_1._)`{}`;
      return errorObject(cxt, error, errorPaths);
    }
    function errorObject(cxt, error, errorPaths = {}) {
      const { gen, it } = cxt;
      const keyValues = [
        errorInstancePath(it, errorPaths),
        errorSchemaPath(cxt, errorPaths)
      ];
      extraErrorProps(cxt, error, keyValues);
      return gen.object(...keyValues);
    }
    function errorInstancePath({ errorPath }, { instancePath }) {
      const instPath = instancePath ? (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(instancePath, util_1.Type.Str)}` : errorPath;
      return [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, instPath)];
    }
    function errorSchemaPath({ keyword, it: { errSchemaPath } }, { schemaPath, parentSchema }) {
      let schPath = parentSchema ? errSchemaPath : (0, codegen_1.str)`${errSchemaPath}/${keyword}`;
      if (schemaPath) {
        schPath = (0, codegen_1.str)`${schPath}${(0, util_1.getErrorPath)(schemaPath, util_1.Type.Str)}`;
      }
      return [E.schemaPath, schPath];
    }
    function extraErrorProps(cxt, { params, message }, keyValues) {
      const { keyword, data, schemaValue, it } = cxt;
      const { opts, propertyName, topSchemaRef, schemaPath } = it;
      keyValues.push([E.keyword, keyword], [E.params, typeof params == "function" ? params(cxt) : params || (0, codegen_1._)`{}`]);
      if (opts.messages) {
        keyValues.push([E.message, typeof message == "function" ? message(cxt) : message]);
      }
      if (opts.verbose) {
        keyValues.push([E.schema, schemaValue], [E.parentSchema, (0, codegen_1._)`${topSchemaRef}${schemaPath}`], [names_1.default.data, data]);
      }
      if (propertyName)
        keyValues.push([E.propertyName, propertyName]);
    }
  }
});

// node_modules/ajv/dist/compile/validate/boolSchema.js
var require_boolSchema = __commonJS({
  "node_modules/ajv/dist/compile/validate/boolSchema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.boolOrEmptySchema = exports.topBoolOrEmptySchema = void 0;
    var errors_1 = require_errors2();
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var boolError = {
      message: "boolean schema is false"
    };
    function topBoolOrEmptySchema(it) {
      const { gen, schema, validateName } = it;
      if (schema === false) {
        falseSchemaError(it, false);
      } else if (typeof schema == "object" && schema.$async === true) {
        gen.return(names_1.default.data);
      } else {
        gen.assign((0, codegen_1._)`${validateName}.errors`, null);
        gen.return(true);
      }
    }
    exports.topBoolOrEmptySchema = topBoolOrEmptySchema;
    function boolOrEmptySchema(it, valid) {
      const { gen, schema } = it;
      if (schema === false) {
        gen.var(valid, false);
        falseSchemaError(it);
      } else {
        gen.var(valid, true);
      }
    }
    exports.boolOrEmptySchema = boolOrEmptySchema;
    function falseSchemaError(it, overrideAllErrors) {
      const { gen, data } = it;
      const cxt = {
        gen,
        keyword: "false schema",
        data,
        schema: false,
        schemaCode: false,
        schemaValue: false,
        params: {},
        it
      };
      (0, errors_1.reportError)(cxt, boolError, void 0, overrideAllErrors);
    }
  }
});

// node_modules/ajv/dist/compile/rules.js
var require_rules = __commonJS({
  "node_modules/ajv/dist/compile/rules.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getRules = exports.isJSONType = void 0;
    var _jsonTypes = ["string", "number", "integer", "boolean", "null", "object", "array"];
    var jsonTypes = new Set(_jsonTypes);
    function isJSONType(x) {
      return typeof x == "string" && jsonTypes.has(x);
    }
    exports.isJSONType = isJSONType;
    function getRules() {
      const groups = {
        number: { type: "number", rules: [] },
        string: { type: "string", rules: [] },
        array: { type: "array", rules: [] },
        object: { type: "object", rules: [] }
      };
      return {
        types: { ...groups, integer: true, boolean: true, null: true },
        rules: [{ rules: [] }, groups.number, groups.string, groups.array, groups.object],
        post: { rules: [] },
        all: {},
        keywords: {}
      };
    }
    exports.getRules = getRules;
  }
});

// node_modules/ajv/dist/compile/validate/applicability.js
var require_applicability = __commonJS({
  "node_modules/ajv/dist/compile/validate/applicability.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.shouldUseRule = exports.shouldUseGroup = exports.schemaHasRulesForType = void 0;
    function schemaHasRulesForType({ schema, self }, type) {
      const group = self.RULES.types[type];
      return group && group !== true && shouldUseGroup(schema, group);
    }
    exports.schemaHasRulesForType = schemaHasRulesForType;
    function shouldUseGroup(schema, group) {
      return group.rules.some((rule) => shouldUseRule(schema, rule));
    }
    exports.shouldUseGroup = shouldUseGroup;
    function shouldUseRule(schema, rule) {
      var _a;
      return schema[rule.keyword] !== void 0 || ((_a = rule.definition.implements) === null || _a === void 0 ? void 0 : _a.some((kwd) => schema[kwd] !== void 0));
    }
    exports.shouldUseRule = shouldUseRule;
  }
});

// node_modules/ajv/dist/compile/validate/dataType.js
var require_dataType = __commonJS({
  "node_modules/ajv/dist/compile/validate/dataType.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.reportTypeError = exports.checkDataTypes = exports.checkDataType = exports.coerceAndCheckDataType = exports.getJSONTypes = exports.getSchemaTypes = exports.DataType = void 0;
    var rules_1 = require_rules();
    var applicability_1 = require_applicability();
    var errors_1 = require_errors2();
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var DataType;
    (function(DataType2) {
      DataType2[DataType2["Correct"] = 0] = "Correct";
      DataType2[DataType2["Wrong"] = 1] = "Wrong";
    })(DataType || (exports.DataType = DataType = {}));
    function getSchemaTypes(schema) {
      const types = getJSONTypes(schema.type);
      const hasNull = types.includes("null");
      if (hasNull) {
        if (schema.nullable === false)
          throw new Error("type: null contradicts nullable: false");
      } else {
        if (!types.length && schema.nullable !== void 0) {
          throw new Error('"nullable" cannot be used without "type"');
        }
        if (schema.nullable === true)
          types.push("null");
      }
      return types;
    }
    exports.getSchemaTypes = getSchemaTypes;
    function getJSONTypes(ts) {
      const types = Array.isArray(ts) ? ts : ts ? [ts] : [];
      if (types.every(rules_1.isJSONType))
        return types;
      throw new Error("type must be JSONType or JSONType[]: " + types.join(","));
    }
    exports.getJSONTypes = getJSONTypes;
    function coerceAndCheckDataType(it, types) {
      const { gen, data, opts } = it;
      const coerceTo = coerceToTypes(types, opts.coerceTypes);
      const checkTypes = types.length > 0 && !(coerceTo.length === 0 && types.length === 1 && (0, applicability_1.schemaHasRulesForType)(it, types[0]));
      if (checkTypes) {
        const wrongType = checkDataTypes(types, data, opts.strictNumbers, DataType.Wrong);
        gen.if(wrongType, () => {
          if (coerceTo.length)
            coerceData(it, types, coerceTo);
          else
            reportTypeError(it);
        });
      }
      return checkTypes;
    }
    exports.coerceAndCheckDataType = coerceAndCheckDataType;
    var COERCIBLE = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
    function coerceToTypes(types, coerceTypes) {
      return coerceTypes ? types.filter((t) => COERCIBLE.has(t) || coerceTypes === "array" && t === "array") : [];
    }
    function coerceData(it, types, coerceTo) {
      const { gen, data, opts } = it;
      const dataType = gen.let("dataType", (0, codegen_1._)`typeof ${data}`);
      const coerced = gen.let("coerced", (0, codegen_1._)`undefined`);
      if (opts.coerceTypes === "array") {
        gen.if((0, codegen_1._)`${dataType} == 'object' && Array.isArray(${data}) && ${data}.length == 1`, () => gen.assign(data, (0, codegen_1._)`${data}[0]`).assign(dataType, (0, codegen_1._)`typeof ${data}`).if(checkDataTypes(types, data, opts.strictNumbers), () => gen.assign(coerced, data)));
      }
      gen.if((0, codegen_1._)`${coerced} !== undefined`);
      for (const t of coerceTo) {
        if (COERCIBLE.has(t) || t === "array" && opts.coerceTypes === "array") {
          coerceSpecificType(t);
        }
      }
      gen.else();
      reportTypeError(it);
      gen.endIf();
      gen.if((0, codegen_1._)`${coerced} !== undefined`, () => {
        gen.assign(data, coerced);
        assignParentData(it, coerced);
      });
      function coerceSpecificType(t) {
        switch (t) {
          case "string":
            gen.elseIf((0, codegen_1._)`${dataType} == "number" || ${dataType} == "boolean"`).assign(coerced, (0, codegen_1._)`"" + ${data}`).elseIf((0, codegen_1._)`${data} === null`).assign(coerced, (0, codegen_1._)`""`);
            return;
          case "number":
            gen.elseIf((0, codegen_1._)`${dataType} == "boolean" || ${data} === null
              || (${dataType} == "string" && ${data} && ${data} == +${data})`).assign(coerced, (0, codegen_1._)`+${data}`);
            return;
          case "integer":
            gen.elseIf((0, codegen_1._)`${dataType} === "boolean" || ${data} === null
              || (${dataType} === "string" && ${data} && ${data} == +${data} && !(${data} % 1))`).assign(coerced, (0, codegen_1._)`+${data}`);
            return;
          case "boolean":
            gen.elseIf((0, codegen_1._)`${data} === "false" || ${data} === 0 || ${data} === null`).assign(coerced, false).elseIf((0, codegen_1._)`${data} === "true" || ${data} === 1`).assign(coerced, true);
            return;
          case "null":
            gen.elseIf((0, codegen_1._)`${data} === "" || ${data} === 0 || ${data} === false`);
            gen.assign(coerced, null);
            return;
          case "array":
            gen.elseIf((0, codegen_1._)`${dataType} === "string" || ${dataType} === "number"
              || ${dataType} === "boolean" || ${data} === null`).assign(coerced, (0, codegen_1._)`[${data}]`);
        }
      }
    }
    function assignParentData({ gen, parentData, parentDataProperty }, expr) {
      gen.if((0, codegen_1._)`${parentData} !== undefined`, () => gen.assign((0, codegen_1._)`${parentData}[${parentDataProperty}]`, expr));
    }
    function checkDataType(dataType, data, strictNums, correct = DataType.Correct) {
      const EQ = correct === DataType.Correct ? codegen_1.operators.EQ : codegen_1.operators.NEQ;
      let cond;
      switch (dataType) {
        case "null":
          return (0, codegen_1._)`${data} ${EQ} null`;
        case "array":
          cond = (0, codegen_1._)`Array.isArray(${data})`;
          break;
        case "object":
          cond = (0, codegen_1._)`${data} && typeof ${data} == "object" && !Array.isArray(${data})`;
          break;
        case "integer":
          cond = numCond((0, codegen_1._)`!(${data} % 1) && !isNaN(${data})`);
          break;
        case "number":
          cond = numCond();
          break;
        default:
          return (0, codegen_1._)`typeof ${data} ${EQ} ${dataType}`;
      }
      return correct === DataType.Correct ? cond : (0, codegen_1.not)(cond);
      function numCond(_cond = codegen_1.nil) {
        return (0, codegen_1.and)((0, codegen_1._)`typeof ${data} == "number"`, _cond, strictNums ? (0, codegen_1._)`isFinite(${data})` : codegen_1.nil);
      }
    }
    exports.checkDataType = checkDataType;
    function checkDataTypes(dataTypes, data, strictNums, correct) {
      if (dataTypes.length === 1) {
        return checkDataType(dataTypes[0], data, strictNums, correct);
      }
      let cond;
      const types = (0, util_1.toHash)(dataTypes);
      if (types.array && types.object) {
        const notObj = (0, codegen_1._)`typeof ${data} != "object"`;
        cond = types.null ? notObj : (0, codegen_1._)`!${data} || ${notObj}`;
        delete types.null;
        delete types.array;
        delete types.object;
      } else {
        cond = codegen_1.nil;
      }
      if (types.number)
        delete types.integer;
      for (const t in types)
        cond = (0, codegen_1.and)(cond, checkDataType(t, data, strictNums, correct));
      return cond;
    }
    exports.checkDataTypes = checkDataTypes;
    var typeError = {
      message: ({ schema }) => `must be ${schema}`,
      params: ({ schema, schemaValue }) => typeof schema == "string" ? (0, codegen_1._)`{type: ${schema}}` : (0, codegen_1._)`{type: ${schemaValue}}`
    };
    function reportTypeError(it) {
      const cxt = getTypeErrorContext(it);
      (0, errors_1.reportError)(cxt, typeError);
    }
    exports.reportTypeError = reportTypeError;
    function getTypeErrorContext(it) {
      const { gen, data, schema } = it;
      const schemaCode = (0, util_1.schemaRefOrVal)(it, schema, "type");
      return {
        gen,
        keyword: "type",
        data,
        schema: schema.type,
        schemaCode,
        schemaValue: schemaCode,
        parentSchema: schema,
        params: {},
        it
      };
    }
  }
});

// node_modules/ajv/dist/compile/validate/defaults.js
var require_defaults = __commonJS({
  "node_modules/ajv/dist/compile/validate/defaults.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.assignDefaults = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    function assignDefaults(it, ty) {
      const { properties, items } = it.schema;
      if (ty === "object" && properties) {
        for (const key in properties) {
          assignDefault(it, key, properties[key].default);
        }
      } else if (ty === "array" && Array.isArray(items)) {
        items.forEach((sch, i) => assignDefault(it, i, sch.default));
      }
    }
    exports.assignDefaults = assignDefaults;
    function assignDefault(it, prop, defaultValue) {
      const { gen, compositeRule, data, opts } = it;
      if (defaultValue === void 0)
        return;
      const childData = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(prop)}`;
      if (compositeRule) {
        (0, util_1.checkStrictMode)(it, `default is ignored for: ${childData}`);
        return;
      }
      let condition = (0, codegen_1._)`${childData} === undefined`;
      if (opts.useDefaults === "empty") {
        condition = (0, codegen_1._)`${condition} || ${childData} === null || ${childData} === ""`;
      }
      gen.if(condition, (0, codegen_1._)`${childData} = ${(0, codegen_1.stringify)(defaultValue)}`);
    }
  }
});

// node_modules/ajv/dist/vocabularies/code.js
var require_code2 = __commonJS({
  "node_modules/ajv/dist/vocabularies/code.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateUnion = exports.validateArray = exports.usePattern = exports.callValidateCode = exports.schemaProperties = exports.allSchemaProperties = exports.noPropertyInData = exports.propertyInData = exports.isOwnProperty = exports.hasPropFunc = exports.reportMissingProp = exports.checkMissingProp = exports.checkReportMissingProp = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var names_1 = require_names();
    var util_2 = require_util();
    function checkReportMissingProp(cxt, prop) {
      const { gen, data, it } = cxt;
      gen.if(noPropertyInData(gen, data, prop, it.opts.ownProperties), () => {
        cxt.setParams({ missingProperty: (0, codegen_1._)`${prop}` }, true);
        cxt.error();
      });
    }
    exports.checkReportMissingProp = checkReportMissingProp;
    function checkMissingProp({ gen, data, it: { opts } }, properties, missing) {
      return (0, codegen_1.or)(...properties.map((prop) => (0, codegen_1.and)(noPropertyInData(gen, data, prop, opts.ownProperties), (0, codegen_1._)`${missing} = ${prop}`)));
    }
    exports.checkMissingProp = checkMissingProp;
    function reportMissingProp(cxt, missing) {
      cxt.setParams({ missingProperty: missing }, true);
      cxt.error();
    }
    exports.reportMissingProp = reportMissingProp;
    function hasPropFunc(gen) {
      return gen.scopeValue("func", {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        ref: Object.prototype.hasOwnProperty,
        code: (0, codegen_1._)`Object.prototype.hasOwnProperty`
      });
    }
    exports.hasPropFunc = hasPropFunc;
    function isOwnProperty(gen, data, property) {
      return (0, codegen_1._)`${hasPropFunc(gen)}.call(${data}, ${property})`;
    }
    exports.isOwnProperty = isOwnProperty;
    function propertyInData(gen, data, property, ownProperties) {
      const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} !== undefined`;
      return ownProperties ? (0, codegen_1._)`${cond} && ${isOwnProperty(gen, data, property)}` : cond;
    }
    exports.propertyInData = propertyInData;
    function noPropertyInData(gen, data, property, ownProperties) {
      const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} === undefined`;
      return ownProperties ? (0, codegen_1.or)(cond, (0, codegen_1.not)(isOwnProperty(gen, data, property))) : cond;
    }
    exports.noPropertyInData = noPropertyInData;
    function allSchemaProperties(schemaMap) {
      return schemaMap ? Object.keys(schemaMap).filter((p) => p !== "__proto__") : [];
    }
    exports.allSchemaProperties = allSchemaProperties;
    function schemaProperties(it, schemaMap) {
      return allSchemaProperties(schemaMap).filter((p) => !(0, util_1.alwaysValidSchema)(it, schemaMap[p]));
    }
    exports.schemaProperties = schemaProperties;
    function callValidateCode({ schemaCode, data, it: { gen, topSchemaRef, schemaPath, errorPath }, it }, func, context, passSchema) {
      const dataAndSchema = passSchema ? (0, codegen_1._)`${schemaCode}, ${data}, ${topSchemaRef}${schemaPath}` : data;
      const valCxt = [
        [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, errorPath)],
        [names_1.default.parentData, it.parentData],
        [names_1.default.parentDataProperty, it.parentDataProperty],
        [names_1.default.rootData, names_1.default.rootData]
      ];
      if (it.opts.dynamicRef)
        valCxt.push([names_1.default.dynamicAnchors, names_1.default.dynamicAnchors]);
      const args = (0, codegen_1._)`${dataAndSchema}, ${gen.object(...valCxt)}`;
      return context !== codegen_1.nil ? (0, codegen_1._)`${func}.call(${context}, ${args})` : (0, codegen_1._)`${func}(${args})`;
    }
    exports.callValidateCode = callValidateCode;
    var newRegExp = (0, codegen_1._)`new RegExp`;
    function usePattern({ gen, it: { opts } }, pattern) {
      const u = opts.unicodeRegExp ? "u" : "";
      const { regExp } = opts.code;
      const rx = regExp(pattern, u);
      return gen.scopeValue("pattern", {
        key: rx.toString(),
        ref: rx,
        code: (0, codegen_1._)`${regExp.code === "new RegExp" ? newRegExp : (0, util_2.useFunc)(gen, regExp)}(${pattern}, ${u})`
      });
    }
    exports.usePattern = usePattern;
    function validateArray(cxt) {
      const { gen, data, keyword, it } = cxt;
      const valid = gen.name("valid");
      if (it.allErrors) {
        const validArr = gen.let("valid", true);
        validateItems(() => gen.assign(validArr, false));
        return validArr;
      }
      gen.var(valid, true);
      validateItems(() => gen.break());
      return valid;
      function validateItems(notValid) {
        const len = gen.const("len", (0, codegen_1._)`${data}.length`);
        gen.forRange("i", 0, len, (i) => {
          cxt.subschema({
            keyword,
            dataProp: i,
            dataPropType: util_1.Type.Num
          }, valid);
          gen.if((0, codegen_1.not)(valid), notValid);
        });
      }
    }
    exports.validateArray = validateArray;
    function validateUnion(cxt) {
      const { gen, schema, keyword, it } = cxt;
      if (!Array.isArray(schema))
        throw new Error("ajv implementation error");
      const alwaysValid = schema.some((sch) => (0, util_1.alwaysValidSchema)(it, sch));
      if (alwaysValid && !it.opts.unevaluated)
        return;
      const valid = gen.let("valid", false);
      const schValid = gen.name("_valid");
      gen.block(() => schema.forEach((_sch, i) => {
        const schCxt = cxt.subschema({
          keyword,
          schemaProp: i,
          compositeRule: true
        }, schValid);
        gen.assign(valid, (0, codegen_1._)`${valid} || ${schValid}`);
        const merged = cxt.mergeValidEvaluated(schCxt, schValid);
        if (!merged)
          gen.if((0, codegen_1.not)(valid));
      }));
      cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
    }
    exports.validateUnion = validateUnion;
  }
});

// node_modules/ajv/dist/compile/validate/keyword.js
var require_keyword = __commonJS({
  "node_modules/ajv/dist/compile/validate/keyword.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateKeywordUsage = exports.validSchemaType = exports.funcKeywordCode = exports.macroKeywordCode = void 0;
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var code_1 = require_code2();
    var errors_1 = require_errors2();
    function macroKeywordCode(cxt, def) {
      const { gen, keyword, schema, parentSchema, it } = cxt;
      const macroSchema = def.macro.call(it.self, schema, parentSchema, it);
      const schemaRef = useKeyword(gen, keyword, macroSchema);
      if (it.opts.validateSchema !== false)
        it.self.validateSchema(macroSchema, true);
      const valid = gen.name("valid");
      cxt.subschema({
        schema: macroSchema,
        schemaPath: codegen_1.nil,
        errSchemaPath: `${it.errSchemaPath}/${keyword}`,
        topSchemaRef: schemaRef,
        compositeRule: true
      }, valid);
      cxt.pass(valid, () => cxt.error(true));
    }
    exports.macroKeywordCode = macroKeywordCode;
    function funcKeywordCode(cxt, def) {
      var _a;
      const { gen, keyword, schema, parentSchema, $data, it } = cxt;
      checkAsyncKeyword(it, def);
      const validate = !$data && def.compile ? def.compile.call(it.self, schema, parentSchema, it) : def.validate;
      const validateRef = useKeyword(gen, keyword, validate);
      const valid = gen.let("valid");
      cxt.block$data(valid, validateKeyword);
      cxt.ok((_a = def.valid) !== null && _a !== void 0 ? _a : valid);
      function validateKeyword() {
        if (def.errors === false) {
          assignValid();
          if (def.modifying)
            modifyData(cxt);
          reportErrs(() => cxt.error());
        } else {
          const ruleErrs = def.async ? validateAsync() : validateSync();
          if (def.modifying)
            modifyData(cxt);
          reportErrs(() => addErrs(cxt, ruleErrs));
        }
      }
      function validateAsync() {
        const ruleErrs = gen.let("ruleErrs", null);
        gen.try(() => assignValid((0, codegen_1._)`await `), (e) => gen.assign(valid, false).if((0, codegen_1._)`${e} instanceof ${it.ValidationError}`, () => gen.assign(ruleErrs, (0, codegen_1._)`${e}.errors`), () => gen.throw(e)));
        return ruleErrs;
      }
      function validateSync() {
        const validateErrs = (0, codegen_1._)`${validateRef}.errors`;
        gen.assign(validateErrs, null);
        assignValid(codegen_1.nil);
        return validateErrs;
      }
      function assignValid(_await = def.async ? (0, codegen_1._)`await ` : codegen_1.nil) {
        const passCxt = it.opts.passContext ? names_1.default.this : names_1.default.self;
        const passSchema = !("compile" in def && !$data || def.schema === false);
        gen.assign(valid, (0, codegen_1._)`${_await}${(0, code_1.callValidateCode)(cxt, validateRef, passCxt, passSchema)}`, def.modifying);
      }
      function reportErrs(errors) {
        var _a2;
        gen.if((0, codegen_1.not)((_a2 = def.valid) !== null && _a2 !== void 0 ? _a2 : valid), errors);
      }
    }
    exports.funcKeywordCode = funcKeywordCode;
    function modifyData(cxt) {
      const { gen, data, it } = cxt;
      gen.if(it.parentData, () => gen.assign(data, (0, codegen_1._)`${it.parentData}[${it.parentDataProperty}]`));
    }
    function addErrs(cxt, errs) {
      const { gen } = cxt;
      gen.if((0, codegen_1._)`Array.isArray(${errs})`, () => {
        gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`).assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
        (0, errors_1.extendErrors)(cxt);
      }, () => cxt.error());
    }
    function checkAsyncKeyword({ schemaEnv }, def) {
      if (def.async && !schemaEnv.$async)
        throw new Error("async keyword in sync schema");
    }
    function useKeyword(gen, keyword, result) {
      if (result === void 0)
        throw new Error(`keyword "${keyword}" failed to compile`);
      return gen.scopeValue("keyword", typeof result == "function" ? { ref: result } : { ref: result, code: (0, codegen_1.stringify)(result) });
    }
    function validSchemaType(schema, schemaType, allowUndefined = false) {
      return !schemaType.length || schemaType.some((st) => st === "array" ? Array.isArray(schema) : st === "object" ? schema && typeof schema == "object" && !Array.isArray(schema) : typeof schema == st || allowUndefined && typeof schema == "undefined");
    }
    exports.validSchemaType = validSchemaType;
    function validateKeywordUsage({ schema, opts, self, errSchemaPath }, def, keyword) {
      if (Array.isArray(def.keyword) ? !def.keyword.includes(keyword) : def.keyword !== keyword) {
        throw new Error("ajv implementation error");
      }
      const deps = def.dependencies;
      if (deps === null || deps === void 0 ? void 0 : deps.some((kwd) => !Object.prototype.hasOwnProperty.call(schema, kwd))) {
        throw new Error(`parent schema must have dependencies of ${keyword}: ${deps.join(",")}`);
      }
      if (def.validateSchema) {
        const valid = def.validateSchema(schema[keyword]);
        if (!valid) {
          const msg = `keyword "${keyword}" value is invalid at path "${errSchemaPath}": ` + self.errorsText(def.validateSchema.errors);
          if (opts.validateSchema === "log")
            self.logger.error(msg);
          else
            throw new Error(msg);
        }
      }
    }
    exports.validateKeywordUsage = validateKeywordUsage;
  }
});

// node_modules/ajv/dist/compile/validate/subschema.js
var require_subschema = __commonJS({
  "node_modules/ajv/dist/compile/validate/subschema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.extendSubschemaMode = exports.extendSubschemaData = exports.getSubschema = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    function getSubschema(it, { keyword, schemaProp, schema, schemaPath, errSchemaPath, topSchemaRef }) {
      if (keyword !== void 0 && schema !== void 0) {
        throw new Error('both "keyword" and "schema" passed, only one allowed');
      }
      if (keyword !== void 0) {
        const sch = it.schema[keyword];
        return schemaProp === void 0 ? {
          schema: sch,
          schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}`,
          errSchemaPath: `${it.errSchemaPath}/${keyword}`
        } : {
          schema: sch[schemaProp],
          schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}${(0, codegen_1.getProperty)(schemaProp)}`,
          errSchemaPath: `${it.errSchemaPath}/${keyword}/${(0, util_1.escapeFragment)(schemaProp)}`
        };
      }
      if (schema !== void 0) {
        if (schemaPath === void 0 || errSchemaPath === void 0 || topSchemaRef === void 0) {
          throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
        }
        return {
          schema,
          schemaPath,
          topSchemaRef,
          errSchemaPath
        };
      }
      throw new Error('either "keyword" or "schema" must be passed');
    }
    exports.getSubschema = getSubschema;
    function extendSubschemaData(subschema, it, { dataProp, dataPropType: dpType, data, dataTypes, propertyName }) {
      if (data !== void 0 && dataProp !== void 0) {
        throw new Error('both "data" and "dataProp" passed, only one allowed');
      }
      const { gen } = it;
      if (dataProp !== void 0) {
        const { errorPath, dataPathArr, opts } = it;
        const nextData = gen.let("data", (0, codegen_1._)`${it.data}${(0, codegen_1.getProperty)(dataProp)}`, true);
        dataContextProps(nextData);
        subschema.errorPath = (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(dataProp, dpType, opts.jsPropertySyntax)}`;
        subschema.parentDataProperty = (0, codegen_1._)`${dataProp}`;
        subschema.dataPathArr = [...dataPathArr, subschema.parentDataProperty];
      }
      if (data !== void 0) {
        const nextData = data instanceof codegen_1.Name ? data : gen.let("data", data, true);
        dataContextProps(nextData);
        if (propertyName !== void 0)
          subschema.propertyName = propertyName;
      }
      if (dataTypes)
        subschema.dataTypes = dataTypes;
      function dataContextProps(_nextData) {
        subschema.data = _nextData;
        subschema.dataLevel = it.dataLevel + 1;
        subschema.dataTypes = [];
        it.definedProperties = /* @__PURE__ */ new Set();
        subschema.parentData = it.data;
        subschema.dataNames = [...it.dataNames, _nextData];
      }
    }
    exports.extendSubschemaData = extendSubschemaData;
    function extendSubschemaMode(subschema, { jtdDiscriminator, jtdMetadata, compositeRule, createErrors, allErrors }) {
      if (compositeRule !== void 0)
        subschema.compositeRule = compositeRule;
      if (createErrors !== void 0)
        subschema.createErrors = createErrors;
      if (allErrors !== void 0)
        subschema.allErrors = allErrors;
      subschema.jtdDiscriminator = jtdDiscriminator;
      subschema.jtdMetadata = jtdMetadata;
    }
    exports.extendSubschemaMode = extendSubschemaMode;
  }
});

// node_modules/fast-deep-equal/index.js
var require_fast_deep_equal = __commonJS({
  "node_modules/fast-deep-equal/index.js"(exports, module) {
    "use strict";
    module.exports = function equal(a, b) {
      if (a === b) return true;
      if (a && b && typeof a == "object" && typeof b == "object") {
        if (a.constructor !== b.constructor) return false;
        var length, i, keys;
        if (Array.isArray(a)) {
          length = a.length;
          if (length != b.length) return false;
          for (i = length; i-- !== 0; )
            if (!equal(a[i], b[i])) return false;
          return true;
        }
        if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
        if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
        if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
        keys = Object.keys(a);
        length = keys.length;
        if (length !== Object.keys(b).length) return false;
        for (i = length; i-- !== 0; )
          if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
        for (i = length; i-- !== 0; ) {
          var key = keys[i];
          if (!equal(a[key], b[key])) return false;
        }
        return true;
      }
      return a !== a && b !== b;
    };
  }
});

// node_modules/json-schema-traverse/index.js
var require_json_schema_traverse = __commonJS({
  "node_modules/json-schema-traverse/index.js"(exports, module) {
    "use strict";
    var traverse = module.exports = function(schema, opts, cb) {
      if (typeof opts == "function") {
        cb = opts;
        opts = {};
      }
      cb = opts.cb || cb;
      var pre = typeof cb == "function" ? cb : cb.pre || function() {
      };
      var post = cb.post || function() {
      };
      _traverse(opts, pre, post, schema, "", schema);
    };
    traverse.keywords = {
      additionalItems: true,
      items: true,
      contains: true,
      additionalProperties: true,
      propertyNames: true,
      not: true,
      if: true,
      then: true,
      else: true
    };
    traverse.arrayKeywords = {
      items: true,
      allOf: true,
      anyOf: true,
      oneOf: true
    };
    traverse.propsKeywords = {
      $defs: true,
      definitions: true,
      properties: true,
      patternProperties: true,
      dependencies: true
    };
    traverse.skipKeywords = {
      default: true,
      enum: true,
      const: true,
      required: true,
      maximum: true,
      minimum: true,
      exclusiveMaximum: true,
      exclusiveMinimum: true,
      multipleOf: true,
      maxLength: true,
      minLength: true,
      pattern: true,
      format: true,
      maxItems: true,
      minItems: true,
      uniqueItems: true,
      maxProperties: true,
      minProperties: true
    };
    function _traverse(opts, pre, post, schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
      if (schema && typeof schema == "object" && !Array.isArray(schema)) {
        pre(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
        for (var key in schema) {
          var sch = schema[key];
          if (Array.isArray(sch)) {
            if (key in traverse.arrayKeywords) {
              for (var i = 0; i < sch.length; i++)
                _traverse(opts, pre, post, sch[i], jsonPtr + "/" + key + "/" + i, rootSchema, jsonPtr, key, schema, i);
            }
          } else if (key in traverse.propsKeywords) {
            if (sch && typeof sch == "object") {
              for (var prop in sch)
                _traverse(opts, pre, post, sch[prop], jsonPtr + "/" + key + "/" + escapeJsonPtr(prop), rootSchema, jsonPtr, key, schema, prop);
            }
          } else if (key in traverse.keywords || opts.allKeys && !(key in traverse.skipKeywords)) {
            _traverse(opts, pre, post, sch, jsonPtr + "/" + key, rootSchema, jsonPtr, key, schema);
          }
        }
        post(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
      }
    }
    function escapeJsonPtr(str) {
      return str.replace(/~/g, "~0").replace(/\//g, "~1");
    }
  }
});

// node_modules/ajv/dist/compile/resolve.js
var require_resolve = __commonJS({
  "node_modules/ajv/dist/compile/resolve.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getSchemaRefs = exports.resolveUrl = exports.normalizeId = exports._getFullPath = exports.getFullPath = exports.inlineRef = void 0;
    var util_1 = require_util();
    var equal = require_fast_deep_equal();
    var traverse = require_json_schema_traverse();
    var SIMPLE_INLINED = /* @__PURE__ */ new Set([
      "type",
      "format",
      "pattern",
      "maxLength",
      "minLength",
      "maxProperties",
      "minProperties",
      "maxItems",
      "minItems",
      "maximum",
      "minimum",
      "uniqueItems",
      "multipleOf",
      "required",
      "enum",
      "const"
    ]);
    function inlineRef(schema, limit = true) {
      if (typeof schema == "boolean")
        return true;
      if (limit === true)
        return !hasRef(schema);
      if (!limit)
        return false;
      return countKeys(schema) <= limit;
    }
    exports.inlineRef = inlineRef;
    var REF_KEYWORDS = /* @__PURE__ */ new Set([
      "$ref",
      "$recursiveRef",
      "$recursiveAnchor",
      "$dynamicRef",
      "$dynamicAnchor"
    ]);
    function hasRef(schema) {
      for (const key in schema) {
        if (REF_KEYWORDS.has(key))
          return true;
        const sch = schema[key];
        if (Array.isArray(sch) && sch.some(hasRef))
          return true;
        if (typeof sch == "object" && hasRef(sch))
          return true;
      }
      return false;
    }
    function countKeys(schema) {
      let count = 0;
      for (const key in schema) {
        if (key === "$ref")
          return Infinity;
        count++;
        if (SIMPLE_INLINED.has(key))
          continue;
        if (typeof schema[key] == "object") {
          (0, util_1.eachItem)(schema[key], (sch) => count += countKeys(sch));
        }
        if (count === Infinity)
          return Infinity;
      }
      return count;
    }
    function getFullPath(resolver, id = "", normalize4) {
      if (normalize4 !== false)
        id = normalizeId(id);
      const p = resolver.parse(id);
      return _getFullPath(resolver, p);
    }
    exports.getFullPath = getFullPath;
    function _getFullPath(resolver, p) {
      const serialized = resolver.serialize(p);
      return serialized.split("#")[0] + "#";
    }
    exports._getFullPath = _getFullPath;
    var TRAILING_SLASH_HASH = /#\/?$/;
    function normalizeId(id) {
      return id ? id.replace(TRAILING_SLASH_HASH, "") : "";
    }
    exports.normalizeId = normalizeId;
    function resolveUrl(resolver, baseId, id) {
      id = normalizeId(id);
      return resolver.resolve(baseId, id);
    }
    exports.resolveUrl = resolveUrl;
    var ANCHOR = /^[a-z_][-a-z0-9._]*$/i;
    function getSchemaRefs(schema, baseId) {
      if (typeof schema == "boolean")
        return {};
      const { schemaId, uriResolver } = this.opts;
      const schId = normalizeId(schema[schemaId] || baseId);
      const baseIds = { "": schId };
      const pathPrefix = getFullPath(uriResolver, schId, false);
      const localRefs = {};
      const schemaRefs = /* @__PURE__ */ new Set();
      traverse(schema, { allKeys: true }, (sch, jsonPtr, _, parentJsonPtr) => {
        if (parentJsonPtr === void 0)
          return;
        const fullPath = pathPrefix + jsonPtr;
        let innerBaseId = baseIds[parentJsonPtr];
        if (typeof sch[schemaId] == "string")
          innerBaseId = addRef.call(this, sch[schemaId]);
        addAnchor.call(this, sch.$anchor);
        addAnchor.call(this, sch.$dynamicAnchor);
        baseIds[jsonPtr] = innerBaseId;
        function addRef(ref) {
          const _resolve = this.opts.uriResolver.resolve;
          ref = normalizeId(innerBaseId ? _resolve(innerBaseId, ref) : ref);
          if (schemaRefs.has(ref))
            throw ambiguos(ref);
          schemaRefs.add(ref);
          let schOrRef = this.refs[ref];
          if (typeof schOrRef == "string")
            schOrRef = this.refs[schOrRef];
          if (typeof schOrRef == "object") {
            checkAmbiguosRef(sch, schOrRef.schema, ref);
          } else if (ref !== normalizeId(fullPath)) {
            if (ref[0] === "#") {
              checkAmbiguosRef(sch, localRefs[ref], ref);
              localRefs[ref] = sch;
            } else {
              this.refs[ref] = fullPath;
            }
          }
          return ref;
        }
        function addAnchor(anchor) {
          if (typeof anchor == "string") {
            if (!ANCHOR.test(anchor))
              throw new Error(`invalid anchor "${anchor}"`);
            addRef.call(this, `#${anchor}`);
          }
        }
      });
      return localRefs;
      function checkAmbiguosRef(sch1, sch2, ref) {
        if (sch2 !== void 0 && !equal(sch1, sch2))
          throw ambiguos(ref);
      }
      function ambiguos(ref) {
        return new Error(`reference "${ref}" resolves to more than one schema`);
      }
    }
    exports.getSchemaRefs = getSchemaRefs;
  }
});

// node_modules/ajv/dist/compile/validate/index.js
var require_validate = __commonJS({
  "node_modules/ajv/dist/compile/validate/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getData = exports.KeywordCxt = exports.validateFunctionCode = void 0;
    var boolSchema_1 = require_boolSchema();
    var dataType_1 = require_dataType();
    var applicability_1 = require_applicability();
    var dataType_2 = require_dataType();
    var defaults_1 = require_defaults();
    var keyword_1 = require_keyword();
    var subschema_1 = require_subschema();
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var resolve_1 = require_resolve();
    var util_1 = require_util();
    var errors_1 = require_errors2();
    function validateFunctionCode(it) {
      if (isSchemaObj(it)) {
        checkKeywords(it);
        if (schemaCxtHasRules(it)) {
          topSchemaObjCode(it);
          return;
        }
      }
      validateFunction(it, () => (0, boolSchema_1.topBoolOrEmptySchema)(it));
    }
    exports.validateFunctionCode = validateFunctionCode;
    function validateFunction({ gen, validateName, schema, schemaEnv, opts }, body) {
      if (opts.code.es5) {
        gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${names_1.default.valCxt}`, schemaEnv.$async, () => {
          gen.code((0, codegen_1._)`"use strict"; ${funcSourceUrl(schema, opts)}`);
          destructureValCxtES5(gen, opts);
          gen.code(body);
        });
      } else {
        gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${destructureValCxt(opts)}`, schemaEnv.$async, () => gen.code(funcSourceUrl(schema, opts)).code(body));
      }
    }
    function destructureValCxt(opts) {
      return (0, codegen_1._)`{${names_1.default.instancePath}="", ${names_1.default.parentData}, ${names_1.default.parentDataProperty}, ${names_1.default.rootData}=${names_1.default.data}${opts.dynamicRef ? (0, codegen_1._)`, ${names_1.default.dynamicAnchors}={}` : codegen_1.nil}}={}`;
    }
    function destructureValCxtES5(gen, opts) {
      gen.if(names_1.default.valCxt, () => {
        gen.var(names_1.default.instancePath, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.instancePath}`);
        gen.var(names_1.default.parentData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentData}`);
        gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentDataProperty}`);
        gen.var(names_1.default.rootData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.rootData}`);
        if (opts.dynamicRef)
          gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.dynamicAnchors}`);
      }, () => {
        gen.var(names_1.default.instancePath, (0, codegen_1._)`""`);
        gen.var(names_1.default.parentData, (0, codegen_1._)`undefined`);
        gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`undefined`);
        gen.var(names_1.default.rootData, names_1.default.data);
        if (opts.dynamicRef)
          gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`{}`);
      });
    }
    function topSchemaObjCode(it) {
      const { schema, opts, gen } = it;
      validateFunction(it, () => {
        if (opts.$comment && schema.$comment)
          commentKeyword(it);
        checkNoDefault(it);
        gen.let(names_1.default.vErrors, null);
        gen.let(names_1.default.errors, 0);
        if (opts.unevaluated)
          resetEvaluated(it);
        typeAndKeywords(it);
        returnResults(it);
      });
      return;
    }
    function resetEvaluated(it) {
      const { gen, validateName } = it;
      it.evaluated = gen.const("evaluated", (0, codegen_1._)`${validateName}.evaluated`);
      gen.if((0, codegen_1._)`${it.evaluated}.dynamicProps`, () => gen.assign((0, codegen_1._)`${it.evaluated}.props`, (0, codegen_1._)`undefined`));
      gen.if((0, codegen_1._)`${it.evaluated}.dynamicItems`, () => gen.assign((0, codegen_1._)`${it.evaluated}.items`, (0, codegen_1._)`undefined`));
    }
    function funcSourceUrl(schema, opts) {
      const schId = typeof schema == "object" && schema[opts.schemaId];
      return schId && (opts.code.source || opts.code.process) ? (0, codegen_1._)`/*# sourceURL=${schId} */` : codegen_1.nil;
    }
    function subschemaCode(it, valid) {
      if (isSchemaObj(it)) {
        checkKeywords(it);
        if (schemaCxtHasRules(it)) {
          subSchemaObjCode(it, valid);
          return;
        }
      }
      (0, boolSchema_1.boolOrEmptySchema)(it, valid);
    }
    function schemaCxtHasRules({ schema, self }) {
      if (typeof schema == "boolean")
        return !schema;
      for (const key in schema)
        if (self.RULES.all[key])
          return true;
      return false;
    }
    function isSchemaObj(it) {
      return typeof it.schema != "boolean";
    }
    function subSchemaObjCode(it, valid) {
      const { schema, gen, opts } = it;
      if (opts.$comment && schema.$comment)
        commentKeyword(it);
      updateContext(it);
      checkAsyncSchema(it);
      const errsCount = gen.const("_errs", names_1.default.errors);
      typeAndKeywords(it, errsCount);
      gen.var(valid, (0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
    }
    function checkKeywords(it) {
      (0, util_1.checkUnknownRules)(it);
      checkRefsAndKeywords(it);
    }
    function typeAndKeywords(it, errsCount) {
      if (it.opts.jtd)
        return schemaKeywords(it, [], false, errsCount);
      const types = (0, dataType_1.getSchemaTypes)(it.schema);
      const checkedTypes = (0, dataType_1.coerceAndCheckDataType)(it, types);
      schemaKeywords(it, types, !checkedTypes, errsCount);
    }
    function checkRefsAndKeywords(it) {
      const { schema, errSchemaPath, opts, self } = it;
      if (schema.$ref && opts.ignoreKeywordsWithRef && (0, util_1.schemaHasRulesButRef)(schema, self.RULES)) {
        self.logger.warn(`$ref: keywords ignored in schema at path "${errSchemaPath}"`);
      }
    }
    function checkNoDefault(it) {
      const { schema, opts } = it;
      if (schema.default !== void 0 && opts.useDefaults && opts.strictSchema) {
        (0, util_1.checkStrictMode)(it, "default is ignored in the schema root");
      }
    }
    function updateContext(it) {
      const schId = it.schema[it.opts.schemaId];
      if (schId)
        it.baseId = (0, resolve_1.resolveUrl)(it.opts.uriResolver, it.baseId, schId);
    }
    function checkAsyncSchema(it) {
      if (it.schema.$async && !it.schemaEnv.$async)
        throw new Error("async schema in sync schema");
    }
    function commentKeyword({ gen, schemaEnv, schema, errSchemaPath, opts }) {
      const msg = schema.$comment;
      if (opts.$comment === true) {
        gen.code((0, codegen_1._)`${names_1.default.self}.logger.log(${msg})`);
      } else if (typeof opts.$comment == "function") {
        const schemaPath = (0, codegen_1.str)`${errSchemaPath}/$comment`;
        const rootName = gen.scopeValue("root", { ref: schemaEnv.root });
        gen.code((0, codegen_1._)`${names_1.default.self}.opts.$comment(${msg}, ${schemaPath}, ${rootName}.schema)`);
      }
    }
    function returnResults(it) {
      const { gen, schemaEnv, validateName, ValidationError, opts } = it;
      if (schemaEnv.$async) {
        gen.if((0, codegen_1._)`${names_1.default.errors} === 0`, () => gen.return(names_1.default.data), () => gen.throw((0, codegen_1._)`new ${ValidationError}(${names_1.default.vErrors})`));
      } else {
        gen.assign((0, codegen_1._)`${validateName}.errors`, names_1.default.vErrors);
        if (opts.unevaluated)
          assignEvaluated(it);
        gen.return((0, codegen_1._)`${names_1.default.errors} === 0`);
      }
    }
    function assignEvaluated({ gen, evaluated, props, items }) {
      if (props instanceof codegen_1.Name)
        gen.assign((0, codegen_1._)`${evaluated}.props`, props);
      if (items instanceof codegen_1.Name)
        gen.assign((0, codegen_1._)`${evaluated}.items`, items);
    }
    function schemaKeywords(it, types, typeErrors, errsCount) {
      const { gen, schema, data, allErrors, opts, self } = it;
      const { RULES } = self;
      if (schema.$ref && (opts.ignoreKeywordsWithRef || !(0, util_1.schemaHasRulesButRef)(schema, RULES))) {
        gen.block(() => keywordCode(it, "$ref", RULES.all.$ref.definition));
        return;
      }
      if (!opts.jtd)
        checkStrictTypes(it, types);
      gen.block(() => {
        for (const group of RULES.rules)
          groupKeywords(group);
        groupKeywords(RULES.post);
      });
      function groupKeywords(group) {
        if (!(0, applicability_1.shouldUseGroup)(schema, group))
          return;
        if (group.type) {
          gen.if((0, dataType_2.checkDataType)(group.type, data, opts.strictNumbers));
          iterateKeywords(it, group);
          if (types.length === 1 && types[0] === group.type && typeErrors) {
            gen.else();
            (0, dataType_2.reportTypeError)(it);
          }
          gen.endIf();
        } else {
          iterateKeywords(it, group);
        }
        if (!allErrors)
          gen.if((0, codegen_1._)`${names_1.default.errors} === ${errsCount || 0}`);
      }
    }
    function iterateKeywords(it, group) {
      const { gen, schema, opts: { useDefaults } } = it;
      if (useDefaults)
        (0, defaults_1.assignDefaults)(it, group.type);
      gen.block(() => {
        for (const rule of group.rules) {
          if ((0, applicability_1.shouldUseRule)(schema, rule)) {
            keywordCode(it, rule.keyword, rule.definition, group.type);
          }
        }
      });
    }
    function checkStrictTypes(it, types) {
      if (it.schemaEnv.meta || !it.opts.strictTypes)
        return;
      checkContextTypes(it, types);
      if (!it.opts.allowUnionTypes)
        checkMultipleTypes(it, types);
      checkKeywordTypes(it, it.dataTypes);
    }
    function checkContextTypes(it, types) {
      if (!types.length)
        return;
      if (!it.dataTypes.length) {
        it.dataTypes = types;
        return;
      }
      types.forEach((t) => {
        if (!includesType(it.dataTypes, t)) {
          strictTypesError(it, `type "${t}" not allowed by context "${it.dataTypes.join(",")}"`);
        }
      });
      narrowSchemaTypes(it, types);
    }
    function checkMultipleTypes(it, ts) {
      if (ts.length > 1 && !(ts.length === 2 && ts.includes("null"))) {
        strictTypesError(it, "use allowUnionTypes to allow union type keyword");
      }
    }
    function checkKeywordTypes(it, ts) {
      const rules = it.self.RULES.all;
      for (const keyword in rules) {
        const rule = rules[keyword];
        if (typeof rule == "object" && (0, applicability_1.shouldUseRule)(it.schema, rule)) {
          const { type } = rule.definition;
          if (type.length && !type.some((t) => hasApplicableType(ts, t))) {
            strictTypesError(it, `missing type "${type.join(",")}" for keyword "${keyword}"`);
          }
        }
      }
    }
    function hasApplicableType(schTs, kwdT) {
      return schTs.includes(kwdT) || kwdT === "number" && schTs.includes("integer");
    }
    function includesType(ts, t) {
      return ts.includes(t) || t === "integer" && ts.includes("number");
    }
    function narrowSchemaTypes(it, withTypes) {
      const ts = [];
      for (const t of it.dataTypes) {
        if (includesType(withTypes, t))
          ts.push(t);
        else if (withTypes.includes("integer") && t === "number")
          ts.push("integer");
      }
      it.dataTypes = ts;
    }
    function strictTypesError(it, msg) {
      const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
      msg += ` at "${schemaPath}" (strictTypes)`;
      (0, util_1.checkStrictMode)(it, msg, it.opts.strictTypes);
    }
    var KeywordCxt = class {
      constructor(it, def, keyword) {
        (0, keyword_1.validateKeywordUsage)(it, def, keyword);
        this.gen = it.gen;
        this.allErrors = it.allErrors;
        this.keyword = keyword;
        this.data = it.data;
        this.schema = it.schema[keyword];
        this.$data = def.$data && it.opts.$data && this.schema && this.schema.$data;
        this.schemaValue = (0, util_1.schemaRefOrVal)(it, this.schema, keyword, this.$data);
        this.schemaType = def.schemaType;
        this.parentSchema = it.schema;
        this.params = {};
        this.it = it;
        this.def = def;
        if (this.$data) {
          this.schemaCode = it.gen.const("vSchema", getData(this.$data, it));
        } else {
          this.schemaCode = this.schemaValue;
          if (!(0, keyword_1.validSchemaType)(this.schema, def.schemaType, def.allowUndefined)) {
            throw new Error(`${keyword} value must be ${JSON.stringify(def.schemaType)}`);
          }
        }
        if ("code" in def ? def.trackErrors : def.errors !== false) {
          this.errsCount = it.gen.const("_errs", names_1.default.errors);
        }
      }
      result(condition, successAction, failAction) {
        this.failResult((0, codegen_1.not)(condition), successAction, failAction);
      }
      failResult(condition, successAction, failAction) {
        this.gen.if(condition);
        if (failAction)
          failAction();
        else
          this.error();
        if (successAction) {
          this.gen.else();
          successAction();
          if (this.allErrors)
            this.gen.endIf();
        } else {
          if (this.allErrors)
            this.gen.endIf();
          else
            this.gen.else();
        }
      }
      pass(condition, failAction) {
        this.failResult((0, codegen_1.not)(condition), void 0, failAction);
      }
      fail(condition) {
        if (condition === void 0) {
          this.error();
          if (!this.allErrors)
            this.gen.if(false);
          return;
        }
        this.gen.if(condition);
        this.error();
        if (this.allErrors)
          this.gen.endIf();
        else
          this.gen.else();
      }
      fail$data(condition) {
        if (!this.$data)
          return this.fail(condition);
        const { schemaCode } = this;
        this.fail((0, codegen_1._)`${schemaCode} !== undefined && (${(0, codegen_1.or)(this.invalid$data(), condition)})`);
      }
      error(append, errorParams, errorPaths) {
        if (errorParams) {
          this.setParams(errorParams);
          this._error(append, errorPaths);
          this.setParams({});
          return;
        }
        this._error(append, errorPaths);
      }
      _error(append, errorPaths) {
        ;
        (append ? errors_1.reportExtraError : errors_1.reportError)(this, this.def.error, errorPaths);
      }
      $dataError() {
        (0, errors_1.reportError)(this, this.def.$dataError || errors_1.keyword$DataError);
      }
      reset() {
        if (this.errsCount === void 0)
          throw new Error('add "trackErrors" to keyword definition');
        (0, errors_1.resetErrorsCount)(this.gen, this.errsCount);
      }
      ok(cond) {
        if (!this.allErrors)
          this.gen.if(cond);
      }
      setParams(obj, assign) {
        if (assign)
          Object.assign(this.params, obj);
        else
          this.params = obj;
      }
      block$data(valid, codeBlock, $dataValid = codegen_1.nil) {
        this.gen.block(() => {
          this.check$data(valid, $dataValid);
          codeBlock();
        });
      }
      check$data(valid = codegen_1.nil, $dataValid = codegen_1.nil) {
        if (!this.$data)
          return;
        const { gen, schemaCode, schemaType, def } = this;
        gen.if((0, codegen_1.or)((0, codegen_1._)`${schemaCode} === undefined`, $dataValid));
        if (valid !== codegen_1.nil)
          gen.assign(valid, true);
        if (schemaType.length || def.validateSchema) {
          gen.elseIf(this.invalid$data());
          this.$dataError();
          if (valid !== codegen_1.nil)
            gen.assign(valid, false);
        }
        gen.else();
      }
      invalid$data() {
        const { gen, schemaCode, schemaType, def, it } = this;
        return (0, codegen_1.or)(wrong$DataType(), invalid$DataSchema());
        function wrong$DataType() {
          if (schemaType.length) {
            if (!(schemaCode instanceof codegen_1.Name))
              throw new Error("ajv implementation error");
            const st = Array.isArray(schemaType) ? schemaType : [schemaType];
            return (0, codegen_1._)`${(0, dataType_2.checkDataTypes)(st, schemaCode, it.opts.strictNumbers, dataType_2.DataType.Wrong)}`;
          }
          return codegen_1.nil;
        }
        function invalid$DataSchema() {
          if (def.validateSchema) {
            const validateSchemaRef = gen.scopeValue("validate$data", { ref: def.validateSchema });
            return (0, codegen_1._)`!${validateSchemaRef}(${schemaCode})`;
          }
          return codegen_1.nil;
        }
      }
      subschema(appl, valid) {
        const subschema = (0, subschema_1.getSubschema)(this.it, appl);
        (0, subschema_1.extendSubschemaData)(subschema, this.it, appl);
        (0, subschema_1.extendSubschemaMode)(subschema, appl);
        const nextContext = { ...this.it, ...subschema, items: void 0, props: void 0 };
        subschemaCode(nextContext, valid);
        return nextContext;
      }
      mergeEvaluated(schemaCxt, toName) {
        const { it, gen } = this;
        if (!it.opts.unevaluated)
          return;
        if (it.props !== true && schemaCxt.props !== void 0) {
          it.props = util_1.mergeEvaluated.props(gen, schemaCxt.props, it.props, toName);
        }
        if (it.items !== true && schemaCxt.items !== void 0) {
          it.items = util_1.mergeEvaluated.items(gen, schemaCxt.items, it.items, toName);
        }
      }
      mergeValidEvaluated(schemaCxt, valid) {
        const { it, gen } = this;
        if (it.opts.unevaluated && (it.props !== true || it.items !== true)) {
          gen.if(valid, () => this.mergeEvaluated(schemaCxt, codegen_1.Name));
          return true;
        }
      }
    };
    exports.KeywordCxt = KeywordCxt;
    function keywordCode(it, keyword, def, ruleType) {
      const cxt = new KeywordCxt(it, def, keyword);
      if ("code" in def) {
        def.code(cxt, ruleType);
      } else if (cxt.$data && def.validate) {
        (0, keyword_1.funcKeywordCode)(cxt, def);
      } else if ("macro" in def) {
        (0, keyword_1.macroKeywordCode)(cxt, def);
      } else if (def.compile || def.validate) {
        (0, keyword_1.funcKeywordCode)(cxt, def);
      }
    }
    var JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/;
    var RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
    function getData($data, { dataLevel, dataNames, dataPathArr }) {
      let jsonPointer;
      let data;
      if ($data === "")
        return names_1.default.rootData;
      if ($data[0] === "/") {
        if (!JSON_POINTER.test($data))
          throw new Error(`Invalid JSON-pointer: ${$data}`);
        jsonPointer = $data;
        data = names_1.default.rootData;
      } else {
        const matches = RELATIVE_JSON_POINTER.exec($data);
        if (!matches)
          throw new Error(`Invalid JSON-pointer: ${$data}`);
        const up = +matches[1];
        jsonPointer = matches[2];
        if (jsonPointer === "#") {
          if (up >= dataLevel)
            throw new Error(errorMsg("property/index", up));
          return dataPathArr[dataLevel - up];
        }
        if (up > dataLevel)
          throw new Error(errorMsg("data", up));
        data = dataNames[dataLevel - up];
        if (!jsonPointer)
          return data;
      }
      let expr = data;
      const segments = jsonPointer.split("/");
      for (const segment of segments) {
        if (segment) {
          data = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)((0, util_1.unescapeJsonPointer)(segment))}`;
          expr = (0, codegen_1._)`${expr} && ${data}`;
        }
      }
      return expr;
      function errorMsg(pointerType, up) {
        return `Cannot access ${pointerType} ${up} levels up, current level is ${dataLevel}`;
      }
    }
    exports.getData = getData;
  }
});

// node_modules/ajv/dist/runtime/validation_error.js
var require_validation_error = __commonJS({
  "node_modules/ajv/dist/runtime/validation_error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ValidationError = class extends Error {
      constructor(errors) {
        super("validation failed");
        this.errors = errors;
        this.ajv = this.validation = true;
      }
    };
    exports.default = ValidationError;
  }
});

// node_modules/ajv/dist/compile/ref_error.js
var require_ref_error = __commonJS({
  "node_modules/ajv/dist/compile/ref_error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var resolve_1 = require_resolve();
    var MissingRefError = class extends Error {
      constructor(resolver, baseId, ref, msg) {
        super(msg || `can't resolve reference ${ref} from id ${baseId}`);
        this.missingRef = (0, resolve_1.resolveUrl)(resolver, baseId, ref);
        this.missingSchema = (0, resolve_1.normalizeId)((0, resolve_1.getFullPath)(resolver, this.missingRef));
      }
    };
    exports.default = MissingRefError;
  }
});

// node_modules/ajv/dist/compile/index.js
var require_compile = __commonJS({
  "node_modules/ajv/dist/compile/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveSchema = exports.getCompilingSchema = exports.resolveRef = exports.compileSchema = exports.SchemaEnv = void 0;
    var codegen_1 = require_codegen();
    var validation_error_1 = require_validation_error();
    var names_1 = require_names();
    var resolve_1 = require_resolve();
    var util_1 = require_util();
    var validate_1 = require_validate();
    var SchemaEnv = class {
      constructor(env) {
        var _a;
        this.refs = {};
        this.dynamicAnchors = {};
        let schema;
        if (typeof env.schema == "object")
          schema = env.schema;
        this.schema = env.schema;
        this.schemaId = env.schemaId;
        this.root = env.root || this;
        this.baseId = (_a = env.baseId) !== null && _a !== void 0 ? _a : (0, resolve_1.normalizeId)(schema === null || schema === void 0 ? void 0 : schema[env.schemaId || "$id"]);
        this.schemaPath = env.schemaPath;
        this.localRefs = env.localRefs;
        this.meta = env.meta;
        this.$async = schema === null || schema === void 0 ? void 0 : schema.$async;
        this.refs = {};
      }
    };
    exports.SchemaEnv = SchemaEnv;
    function compileSchema(sch) {
      const _sch = getCompilingSchema.call(this, sch);
      if (_sch)
        return _sch;
      const rootId = (0, resolve_1.getFullPath)(this.opts.uriResolver, sch.root.baseId);
      const { es5, lines } = this.opts.code;
      const { ownProperties } = this.opts;
      const gen = new codegen_1.CodeGen(this.scope, { es5, lines, ownProperties });
      let _ValidationError;
      if (sch.$async) {
        _ValidationError = gen.scopeValue("Error", {
          ref: validation_error_1.default,
          code: (0, codegen_1._)`require("ajv/dist/runtime/validation_error").default`
        });
      }
      const validateName = gen.scopeName("validate");
      sch.validateName = validateName;
      const schemaCxt = {
        gen,
        allErrors: this.opts.allErrors,
        data: names_1.default.data,
        parentData: names_1.default.parentData,
        parentDataProperty: names_1.default.parentDataProperty,
        dataNames: [names_1.default.data],
        dataPathArr: [codegen_1.nil],
        // TODO can its length be used as dataLevel if nil is removed?
        dataLevel: 0,
        dataTypes: [],
        definedProperties: /* @__PURE__ */ new Set(),
        topSchemaRef: gen.scopeValue("schema", this.opts.code.source === true ? { ref: sch.schema, code: (0, codegen_1.stringify)(sch.schema) } : { ref: sch.schema }),
        validateName,
        ValidationError: _ValidationError,
        schema: sch.schema,
        schemaEnv: sch,
        rootId,
        baseId: sch.baseId || rootId,
        schemaPath: codegen_1.nil,
        errSchemaPath: sch.schemaPath || (this.opts.jtd ? "" : "#"),
        errorPath: (0, codegen_1._)`""`,
        opts: this.opts,
        self: this
      };
      let sourceCode;
      try {
        this._compilations.add(sch);
        (0, validate_1.validateFunctionCode)(schemaCxt);
        gen.optimize(this.opts.code.optimize);
        const validateCode = gen.toString();
        sourceCode = `${gen.scopeRefs(names_1.default.scope)}return ${validateCode}`;
        if (this.opts.code.process)
          sourceCode = this.opts.code.process(sourceCode, sch);
        const makeValidate = new Function(`${names_1.default.self}`, `${names_1.default.scope}`, sourceCode);
        const validate = makeValidate(this, this.scope.get());
        this.scope.value(validateName, { ref: validate });
        validate.errors = null;
        validate.schema = sch.schema;
        validate.schemaEnv = sch;
        if (sch.$async)
          validate.$async = true;
        if (this.opts.code.source === true) {
          validate.source = { validateName, validateCode, scopeValues: gen._values };
        }
        if (this.opts.unevaluated) {
          const { props, items } = schemaCxt;
          validate.evaluated = {
            props: props instanceof codegen_1.Name ? void 0 : props,
            items: items instanceof codegen_1.Name ? void 0 : items,
            dynamicProps: props instanceof codegen_1.Name,
            dynamicItems: items instanceof codegen_1.Name
          };
          if (validate.source)
            validate.source.evaluated = (0, codegen_1.stringify)(validate.evaluated);
        }
        sch.validate = validate;
        return sch;
      } catch (e) {
        delete sch.validate;
        delete sch.validateName;
        if (sourceCode)
          this.logger.error("Error compiling schema, function code:", sourceCode);
        throw e;
      } finally {
        this._compilations.delete(sch);
      }
    }
    exports.compileSchema = compileSchema;
    function resolveRef(root, baseId, ref) {
      var _a;
      ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, ref);
      const schOrFunc = root.refs[ref];
      if (schOrFunc)
        return schOrFunc;
      let _sch = resolve18.call(this, root, ref);
      if (_sch === void 0) {
        const schema = (_a = root.localRefs) === null || _a === void 0 ? void 0 : _a[ref];
        const { schemaId } = this.opts;
        if (schema)
          _sch = new SchemaEnv({ schema, schemaId, root, baseId });
      }
      if (_sch === void 0)
        return;
      return root.refs[ref] = inlineOrCompile.call(this, _sch);
    }
    exports.resolveRef = resolveRef;
    function inlineOrCompile(sch) {
      if ((0, resolve_1.inlineRef)(sch.schema, this.opts.inlineRefs))
        return sch.schema;
      return sch.validate ? sch : compileSchema.call(this, sch);
    }
    function getCompilingSchema(schEnv) {
      for (const sch of this._compilations) {
        if (sameSchemaEnv(sch, schEnv))
          return sch;
      }
    }
    exports.getCompilingSchema = getCompilingSchema;
    function sameSchemaEnv(s1, s2) {
      return s1.schema === s2.schema && s1.root === s2.root && s1.baseId === s2.baseId;
    }
    function resolve18(root, ref) {
      let sch;
      while (typeof (sch = this.refs[ref]) == "string")
        ref = sch;
      return sch || this.schemas[ref] || resolveSchema.call(this, root, ref);
    }
    function resolveSchema(root, ref) {
      const p = this.opts.uriResolver.parse(ref);
      const refPath = (0, resolve_1._getFullPath)(this.opts.uriResolver, p);
      let baseId = (0, resolve_1.getFullPath)(this.opts.uriResolver, root.baseId, void 0);
      if (Object.keys(root.schema).length > 0 && refPath === baseId) {
        return getJsonPointer.call(this, p, root);
      }
      const id = (0, resolve_1.normalizeId)(refPath);
      const schOrRef = this.refs[id] || this.schemas[id];
      if (typeof schOrRef == "string") {
        const sch = resolveSchema.call(this, root, schOrRef);
        if (typeof (sch === null || sch === void 0 ? void 0 : sch.schema) !== "object")
          return;
        return getJsonPointer.call(this, p, sch);
      }
      if (typeof (schOrRef === null || schOrRef === void 0 ? void 0 : schOrRef.schema) !== "object")
        return;
      if (!schOrRef.validate)
        compileSchema.call(this, schOrRef);
      if (id === (0, resolve_1.normalizeId)(ref)) {
        const { schema } = schOrRef;
        const { schemaId } = this.opts;
        const schId = schema[schemaId];
        if (schId)
          baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
        return new SchemaEnv({ schema, schemaId, root, baseId });
      }
      return getJsonPointer.call(this, p, schOrRef);
    }
    exports.resolveSchema = resolveSchema;
    var PREVENT_SCOPE_CHANGE = /* @__PURE__ */ new Set([
      "properties",
      "patternProperties",
      "enum",
      "dependencies",
      "definitions"
    ]);
    function getJsonPointer(parsedRef, { baseId, schema, root }) {
      var _a;
      if (((_a = parsedRef.fragment) === null || _a === void 0 ? void 0 : _a[0]) !== "/")
        return;
      for (const part of parsedRef.fragment.slice(1).split("/")) {
        if (typeof schema === "boolean")
          return;
        const partSchema = schema[(0, util_1.unescapeFragment)(part)];
        if (partSchema === void 0)
          return;
        schema = partSchema;
        const schId = typeof schema === "object" && schema[this.opts.schemaId];
        if (!PREVENT_SCOPE_CHANGE.has(part) && schId) {
          baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
        }
      }
      let env;
      if (typeof schema != "boolean" && schema.$ref && !(0, util_1.schemaHasRulesButRef)(schema, this.RULES)) {
        const $ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schema.$ref);
        env = resolveSchema.call(this, root, $ref);
      }
      const { schemaId } = this.opts;
      env = env || new SchemaEnv({ schema, schemaId, root, baseId });
      if (env.schema !== env.root.schema)
        return env;
      return void 0;
    }
  }
});

// node_modules/ajv/dist/refs/data.json
var require_data = __commonJS({
  "node_modules/ajv/dist/refs/data.json"(exports, module) {
    module.exports = {
      $id: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
      description: "Meta-schema for $data reference (JSON AnySchema extension proposal)",
      type: "object",
      required: ["$data"],
      properties: {
        $data: {
          type: "string",
          anyOf: [{ format: "relative-json-pointer" }, { format: "json-pointer" }]
        }
      },
      additionalProperties: false
    };
  }
});

// node_modules/fast-uri/lib/utils.js
var require_utils = __commonJS({
  "node_modules/fast-uri/lib/utils.js"(exports, module) {
    "use strict";
    var isUUID = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu);
    var isIPv4 = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u);
    var isHexPair = RegExp.prototype.test.bind(/^[\da-f]{2}$/iu);
    var isUnreserved = RegExp.prototype.test.bind(/^[\da-z\-._~]$/iu);
    var isPathCharacter = RegExp.prototype.test.bind(/^[\da-z\-._~!$&'()*+,;=:@/]$/iu);
    function stringArrayToHexStripped(input) {
      let acc = "";
      let code = 0;
      let i = 0;
      for (i = 0; i < input.length; i++) {
        code = input[i].charCodeAt(0);
        if (code === 48) {
          continue;
        }
        if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102)) {
          return "";
        }
        acc += input[i];
        break;
      }
      for (i += 1; i < input.length; i++) {
        code = input[i].charCodeAt(0);
        if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102)) {
          return "";
        }
        acc += input[i];
      }
      return acc;
    }
    var nonSimpleDomain = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
    function consumeIsZone(buffer) {
      buffer.length = 0;
      return true;
    }
    function consumeHextets(buffer, address, output) {
      if (buffer.length) {
        const hex = stringArrayToHexStripped(buffer);
        if (hex !== "") {
          address.push(hex);
        } else {
          output.error = true;
          return false;
        }
        buffer.length = 0;
      }
      return true;
    }
    function getIPV6(input) {
      let tokenCount = 0;
      const output = { error: false, address: "", zone: "" };
      const address = [];
      const buffer = [];
      let endipv6Encountered = false;
      let endIpv6 = false;
      let consume = consumeHextets;
      for (let i = 0; i < input.length; i++) {
        const cursor = input[i];
        if (cursor === "[" || cursor === "]") {
          continue;
        }
        if (cursor === ":") {
          if (endipv6Encountered === true) {
            endIpv6 = true;
          }
          if (!consume(buffer, address, output)) {
            break;
          }
          if (++tokenCount > 7) {
            output.error = true;
            break;
          }
          if (i > 0 && input[i - 1] === ":") {
            endipv6Encountered = true;
          }
          address.push(":");
          continue;
        } else if (cursor === "%") {
          if (!consume(buffer, address, output)) {
            break;
          }
          consume = consumeIsZone;
        } else {
          buffer.push(cursor);
          continue;
        }
      }
      if (buffer.length) {
        if (consume === consumeIsZone) {
          output.zone = buffer.join("");
        } else if (endIpv6) {
          address.push(buffer.join(""));
        } else {
          address.push(stringArrayToHexStripped(buffer));
        }
      }
      output.address = address.join("");
      return output;
    }
    function normalizeIPv6(host) {
      if (findToken(host, ":") < 2) {
        return { host, isIPV6: false };
      }
      const ipv6 = getIPV6(host);
      if (!ipv6.error) {
        let newHost = ipv6.address;
        let escapedHost = ipv6.address;
        if (ipv6.zone) {
          newHost += "%" + ipv6.zone;
          escapedHost += "%25" + ipv6.zone;
        }
        return { host: newHost, isIPV6: true, escapedHost };
      } else {
        return { host, isIPV6: false };
      }
    }
    function findToken(str, token) {
      let ind = 0;
      for (let i = 0; i < str.length; i++) {
        if (str[i] === token) ind++;
      }
      return ind;
    }
    function removeDotSegments(path) {
      let input = path;
      const output = [];
      let nextSlash = -1;
      let len = 0;
      while (len = input.length) {
        if (len === 1) {
          if (input === ".") {
            break;
          } else if (input === "/") {
            output.push("/");
            break;
          } else {
            output.push(input);
            break;
          }
        } else if (len === 2) {
          if (input[0] === ".") {
            if (input[1] === ".") {
              break;
            } else if (input[1] === "/") {
              input = input.slice(2);
              continue;
            }
          } else if (input[0] === "/") {
            if (input[1] === "." || input[1] === "/") {
              output.push("/");
              break;
            }
          }
        } else if (len === 3) {
          if (input === "/..") {
            if (output.length !== 0) {
              output.pop();
            }
            output.push("/");
            break;
          }
        }
        if (input[0] === ".") {
          if (input[1] === ".") {
            if (input[2] === "/") {
              input = input.slice(3);
              continue;
            }
          } else if (input[1] === "/") {
            input = input.slice(2);
            continue;
          }
        } else if (input[0] === "/") {
          if (input[1] === ".") {
            if (input[2] === "/") {
              input = input.slice(2);
              continue;
            } else if (input[2] === ".") {
              if (input[3] === "/") {
                input = input.slice(3);
                if (output.length !== 0) {
                  output.pop();
                }
                continue;
              }
            }
          }
        }
        if ((nextSlash = input.indexOf("/", 1)) === -1) {
          output.push(input);
          break;
        } else {
          output.push(input.slice(0, nextSlash));
          input = input.slice(nextSlash);
        }
      }
      return output.join("");
    }
    var HOST_DELIMS = { "@": "%40", "/": "%2F", "?": "%3F", "#": "%23", ":": "%3A" };
    var HOST_DELIM_RE = /[@/?#:]/g;
    var HOST_DELIM_NO_COLON_RE = /[@/?#]/g;
    function reescapeHostDelimiters(host, isIP) {
      const re = isIP ? HOST_DELIM_NO_COLON_RE : HOST_DELIM_RE;
      re.lastIndex = 0;
      return host.replace(re, (ch) => HOST_DELIMS[ch]);
    }
    function normalizePercentEncoding(input, decodeUnreserved = false) {
      if (input.indexOf("%") === -1) {
        return input;
      }
      let output = "";
      for (let i = 0; i < input.length; i++) {
        if (input[i] === "%" && i + 2 < input.length) {
          const hex = input.slice(i + 1, i + 3);
          if (isHexPair(hex)) {
            const normalizedHex = hex.toUpperCase();
            const decoded = String.fromCharCode(parseInt(normalizedHex, 16));
            if (decodeUnreserved && isUnreserved(decoded)) {
              output += decoded;
            } else {
              output += "%" + normalizedHex;
            }
            i += 2;
            continue;
          }
        }
        output += input[i];
      }
      return output;
    }
    function normalizePathEncoding(input) {
      let output = "";
      for (let i = 0; i < input.length; i++) {
        if (input[i] === "%" && i + 2 < input.length) {
          const hex = input.slice(i + 1, i + 3);
          if (isHexPair(hex)) {
            const normalizedHex = hex.toUpperCase();
            const decoded = String.fromCharCode(parseInt(normalizedHex, 16));
            if (decoded !== "." && isUnreserved(decoded)) {
              output += decoded;
            } else {
              output += "%" + normalizedHex;
            }
            i += 2;
            continue;
          }
        }
        if (isPathCharacter(input[i])) {
          output += input[i];
        } else {
          output += escape(input[i]);
        }
      }
      return output;
    }
    function escapePreservingEscapes(input) {
      let output = "";
      for (let i = 0; i < input.length; i++) {
        if (input[i] === "%" && i + 2 < input.length) {
          const hex = input.slice(i + 1, i + 3);
          if (isHexPair(hex)) {
            output += "%" + hex.toUpperCase();
            i += 2;
            continue;
          }
        }
        output += escape(input[i]);
      }
      return output;
    }
    function recomposeAuthority(component) {
      const uriTokens = [];
      if (component.userinfo !== void 0) {
        uriTokens.push(component.userinfo);
        uriTokens.push("@");
      }
      if (component.host !== void 0) {
        let host = unescape(component.host);
        if (!isIPv4(host)) {
          const ipV6res = normalizeIPv6(host);
          if (ipV6res.isIPV6 === true) {
            host = `[${ipV6res.escapedHost}]`;
          } else {
            host = reescapeHostDelimiters(host, false);
          }
        }
        uriTokens.push(host);
      }
      if (typeof component.port === "number" || typeof component.port === "string") {
        uriTokens.push(":");
        uriTokens.push(String(component.port));
      }
      return uriTokens.length ? uriTokens.join("") : void 0;
    }
    module.exports = {
      nonSimpleDomain,
      recomposeAuthority,
      reescapeHostDelimiters,
      normalizePercentEncoding,
      normalizePathEncoding,
      escapePreservingEscapes,
      removeDotSegments,
      isIPv4,
      isUUID,
      normalizeIPv6,
      stringArrayToHexStripped
    };
  }
});

// node_modules/fast-uri/lib/schemes.js
var require_schemes = __commonJS({
  "node_modules/fast-uri/lib/schemes.js"(exports, module) {
    "use strict";
    var { isUUID } = require_utils();
    var URN_REG = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu;
    var supportedSchemeNames = (
      /** @type {const} */
      [
        "http",
        "https",
        "ws",
        "wss",
        "urn",
        "urn:uuid"
      ]
    );
    function isValidSchemeName(name) {
      return supportedSchemeNames.indexOf(
        /** @type {*} */
        name
      ) !== -1;
    }
    function wsIsSecure(wsComponent) {
      if (wsComponent.secure === true) {
        return true;
      } else if (wsComponent.secure === false) {
        return false;
      } else if (wsComponent.scheme) {
        return wsComponent.scheme.length === 3 && (wsComponent.scheme[0] === "w" || wsComponent.scheme[0] === "W") && (wsComponent.scheme[1] === "s" || wsComponent.scheme[1] === "S") && (wsComponent.scheme[2] === "s" || wsComponent.scheme[2] === "S");
      } else {
        return false;
      }
    }
    function httpParse(component) {
      if (!component.host) {
        component.error = component.error || "HTTP URIs must have a host.";
      }
      return component;
    }
    function httpSerialize(component) {
      const secure = String(component.scheme).toLowerCase() === "https";
      if (component.port === (secure ? 443 : 80) || component.port === "") {
        component.port = void 0;
      }
      if (!component.path) {
        component.path = "/";
      }
      return component;
    }
    function wsParse(wsComponent) {
      wsComponent.secure = wsIsSecure(wsComponent);
      wsComponent.resourceName = (wsComponent.path || "/") + (wsComponent.query ? "?" + wsComponent.query : "");
      wsComponent.path = void 0;
      wsComponent.query = void 0;
      return wsComponent;
    }
    function wsSerialize(wsComponent) {
      if (wsComponent.port === (wsIsSecure(wsComponent) ? 443 : 80) || wsComponent.port === "") {
        wsComponent.port = void 0;
      }
      if (typeof wsComponent.secure === "boolean") {
        wsComponent.scheme = wsComponent.secure ? "wss" : "ws";
        wsComponent.secure = void 0;
      }
      if (wsComponent.resourceName) {
        const [path, query] = wsComponent.resourceName.split("?");
        wsComponent.path = path && path !== "/" ? path : void 0;
        wsComponent.query = query;
        wsComponent.resourceName = void 0;
      }
      wsComponent.fragment = void 0;
      return wsComponent;
    }
    function urnParse(urnComponent, options) {
      if (!urnComponent.path) {
        urnComponent.error = "URN can not be parsed";
        return urnComponent;
      }
      const matches = urnComponent.path.match(URN_REG);
      if (matches) {
        const scheme = options.scheme || urnComponent.scheme || "urn";
        urnComponent.nid = matches[1].toLowerCase();
        urnComponent.nss = matches[2];
        const urnScheme = `${scheme}:${options.nid || urnComponent.nid}`;
        const schemeHandler = getSchemeHandler(urnScheme);
        urnComponent.path = void 0;
        if (schemeHandler) {
          urnComponent = schemeHandler.parse(urnComponent, options);
        }
      } else {
        urnComponent.error = urnComponent.error || "URN can not be parsed.";
      }
      return urnComponent;
    }
    function urnSerialize(urnComponent, options) {
      if (urnComponent.nid === void 0) {
        throw new Error("URN without nid cannot be serialized");
      }
      const scheme = options.scheme || urnComponent.scheme || "urn";
      const nid = urnComponent.nid.toLowerCase();
      const urnScheme = `${scheme}:${options.nid || nid}`;
      const schemeHandler = getSchemeHandler(urnScheme);
      if (schemeHandler) {
        urnComponent = schemeHandler.serialize(urnComponent, options);
      }
      const uriComponent = urnComponent;
      const nss = urnComponent.nss;
      uriComponent.path = `${nid || options.nid}:${nss}`;
      options.skipEscape = true;
      return uriComponent;
    }
    function urnuuidParse(urnComponent, options) {
      const uuidComponent = urnComponent;
      uuidComponent.uuid = uuidComponent.nss;
      uuidComponent.nss = void 0;
      if (!options.tolerant && (!uuidComponent.uuid || !isUUID(uuidComponent.uuid))) {
        uuidComponent.error = uuidComponent.error || "UUID is not valid.";
      }
      return uuidComponent;
    }
    function urnuuidSerialize(uuidComponent) {
      const urnComponent = uuidComponent;
      urnComponent.nss = (uuidComponent.uuid || "").toLowerCase();
      return urnComponent;
    }
    var http = (
      /** @type {SchemeHandler} */
      {
        scheme: "http",
        domainHost: true,
        parse: httpParse,
        serialize: httpSerialize
      }
    );
    var https = (
      /** @type {SchemeHandler} */
      {
        scheme: "https",
        domainHost: http.domainHost,
        parse: httpParse,
        serialize: httpSerialize
      }
    );
    var ws = (
      /** @type {SchemeHandler} */
      {
        scheme: "ws",
        domainHost: true,
        parse: wsParse,
        serialize: wsSerialize
      }
    );
    var wss = (
      /** @type {SchemeHandler} */
      {
        scheme: "wss",
        domainHost: ws.domainHost,
        parse: ws.parse,
        serialize: ws.serialize
      }
    );
    var urn = (
      /** @type {SchemeHandler} */
      {
        scheme: "urn",
        parse: urnParse,
        serialize: urnSerialize,
        skipNormalize: true
      }
    );
    var urnuuid = (
      /** @type {SchemeHandler} */
      {
        scheme: "urn:uuid",
        parse: urnuuidParse,
        serialize: urnuuidSerialize,
        skipNormalize: true
      }
    );
    var SCHEMES = (
      /** @type {Record<SchemeName, SchemeHandler>} */
      {
        http,
        https,
        ws,
        wss,
        urn,
        "urn:uuid": urnuuid
      }
    );
    Object.setPrototypeOf(SCHEMES, null);
    function getSchemeHandler(scheme) {
      return scheme && (SCHEMES[
        /** @type {SchemeName} */
        scheme
      ] || SCHEMES[
        /** @type {SchemeName} */
        scheme.toLowerCase()
      ]) || void 0;
    }
    module.exports = {
      wsIsSecure,
      SCHEMES,
      isValidSchemeName,
      getSchemeHandler
    };
  }
});

// node_modules/fast-uri/index.js
var require_fast_uri = __commonJS({
  "node_modules/fast-uri/index.js"(exports, module) {
    "use strict";
    var { normalizeIPv6, removeDotSegments, recomposeAuthority, normalizePercentEncoding, normalizePathEncoding, escapePreservingEscapes, reescapeHostDelimiters, isIPv4, nonSimpleDomain } = require_utils();
    var { SCHEMES, getSchemeHandler } = require_schemes();
    function normalize4(uri, options) {
      if (typeof uri === "string") {
        uri = /** @type {T} */
        normalizeString(uri, options);
      } else if (typeof uri === "object") {
        uri = /** @type {T} */
        parse(serialize(uri, options), options);
      }
      return uri;
    }
    function resolve18(baseURI, relativeURI, options) {
      const schemelessOptions = options ? Object.assign({ scheme: "null" }, options) : { scheme: "null" };
      const resolved = resolveComponent(parse(baseURI, schemelessOptions), parse(relativeURI, schemelessOptions), schemelessOptions, true);
      schemelessOptions.skipEscape = true;
      return serialize(resolved, schemelessOptions);
    }
    function resolveComponent(base, relative11, options, skipNormalization) {
      const target = {};
      if (!skipNormalization) {
        base = parse(serialize(base, options), options);
        relative11 = parse(serialize(relative11, options), options);
      }
      options = options || {};
      if (!options.tolerant && relative11.scheme) {
        target.scheme = relative11.scheme;
        target.userinfo = relative11.userinfo;
        target.host = relative11.host;
        target.port = relative11.port;
        target.path = removeDotSegments(relative11.path || "");
        target.query = relative11.query;
      } else {
        if (relative11.userinfo !== void 0 || relative11.host !== void 0 || relative11.port !== void 0) {
          target.userinfo = relative11.userinfo;
          target.host = relative11.host;
          target.port = relative11.port;
          target.path = removeDotSegments(relative11.path || "");
          target.query = relative11.query;
        } else {
          if (!relative11.path) {
            target.path = base.path;
            if (relative11.query !== void 0) {
              target.query = relative11.query;
            } else {
              target.query = base.query;
            }
          } else {
            if (relative11.path[0] === "/") {
              target.path = removeDotSegments(relative11.path);
            } else {
              if ((base.userinfo !== void 0 || base.host !== void 0 || base.port !== void 0) && !base.path) {
                target.path = "/" + relative11.path;
              } else if (!base.path) {
                target.path = relative11.path;
              } else {
                target.path = base.path.slice(0, base.path.lastIndexOf("/") + 1) + relative11.path;
              }
              target.path = removeDotSegments(target.path);
            }
            target.query = relative11.query;
          }
          target.userinfo = base.userinfo;
          target.host = base.host;
          target.port = base.port;
        }
        target.scheme = base.scheme;
      }
      target.fragment = relative11.fragment;
      return target;
    }
    function equal(uriA, uriB, options) {
      const normalizedA = normalizeComparableURI(uriA, options);
      const normalizedB = normalizeComparableURI(uriB, options);
      return normalizedA !== void 0 && normalizedB !== void 0 && normalizedA.toLowerCase() === normalizedB.toLowerCase();
    }
    function serialize(cmpts, opts) {
      const component = {
        host: cmpts.host,
        scheme: cmpts.scheme,
        userinfo: cmpts.userinfo,
        port: cmpts.port,
        path: cmpts.path,
        query: cmpts.query,
        nid: cmpts.nid,
        nss: cmpts.nss,
        uuid: cmpts.uuid,
        fragment: cmpts.fragment,
        reference: cmpts.reference,
        resourceName: cmpts.resourceName,
        secure: cmpts.secure,
        error: ""
      };
      const options = Object.assign({}, opts);
      const uriTokens = [];
      const schemeHandler = getSchemeHandler(options.scheme || component.scheme);
      if (schemeHandler && schemeHandler.serialize) schemeHandler.serialize(component, options);
      if (component.path !== void 0) {
        if (!options.skipEscape) {
          component.path = escapePreservingEscapes(component.path);
          if (component.scheme !== void 0) {
            component.path = component.path.split("%3A").join(":");
          }
        } else {
          component.path = normalizePercentEncoding(component.path);
        }
      }
      if (options.reference !== "suffix" && component.scheme) {
        uriTokens.push(component.scheme, ":");
      }
      const authority = recomposeAuthority(component);
      if (authority !== void 0) {
        if (options.reference !== "suffix") {
          uriTokens.push("//");
        }
        uriTokens.push(authority);
        if (component.path && component.path[0] !== "/") {
          uriTokens.push("/");
        }
      }
      if (component.path !== void 0) {
        let s = component.path;
        if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) {
          s = removeDotSegments(s);
        }
        if (authority === void 0 && s[0] === "/" && s[1] === "/") {
          s = "/%2F" + s.slice(2);
        }
        uriTokens.push(s);
      }
      if (component.query !== void 0) {
        uriTokens.push("?", component.query);
      }
      if (component.fragment !== void 0) {
        uriTokens.push("#", component.fragment);
      }
      return uriTokens.join("");
    }
    var URI_PARSE = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
    function getParseError(parsed, matches) {
      if (matches[2] !== void 0 && parsed.path && parsed.path[0] !== "/") {
        return 'URI path must start with "/" when authority is present.';
      }
      if (typeof parsed.port === "number" && (parsed.port < 0 || parsed.port > 65535)) {
        return "URI port is malformed.";
      }
      return void 0;
    }
    function parseWithStatus(uri, opts) {
      const options = Object.assign({}, opts);
      const parsed = {
        scheme: void 0,
        userinfo: void 0,
        host: "",
        port: void 0,
        path: "",
        query: void 0,
        fragment: void 0
      };
      let malformedAuthorityOrPort = false;
      let isIP = false;
      if (options.reference === "suffix") {
        if (options.scheme) {
          uri = options.scheme + ":" + uri;
        } else {
          uri = "//" + uri;
        }
      }
      const matches = uri.match(URI_PARSE);
      if (matches) {
        parsed.scheme = matches[1];
        parsed.userinfo = matches[3];
        parsed.host = matches[4];
        parsed.port = parseInt(matches[5], 10);
        parsed.path = matches[6] || "";
        parsed.query = matches[7];
        parsed.fragment = matches[8];
        if (isNaN(parsed.port)) {
          parsed.port = matches[5];
        }
        const parseError = getParseError(parsed, matches);
        if (parseError !== void 0) {
          parsed.error = parsed.error || parseError;
          malformedAuthorityOrPort = true;
        }
        if (parsed.host) {
          const ipv4result = isIPv4(parsed.host);
          if (ipv4result === false) {
            const ipv6result = normalizeIPv6(parsed.host);
            parsed.host = ipv6result.host.toLowerCase();
            isIP = ipv6result.isIPV6;
          } else {
            isIP = true;
          }
        }
        if (parsed.scheme === void 0 && parsed.userinfo === void 0 && parsed.host === void 0 && parsed.port === void 0 && parsed.query === void 0 && !parsed.path) {
          parsed.reference = "same-document";
        } else if (parsed.scheme === void 0) {
          parsed.reference = "relative";
        } else if (parsed.fragment === void 0) {
          parsed.reference = "absolute";
        } else {
          parsed.reference = "uri";
        }
        if (options.reference && options.reference !== "suffix" && options.reference !== parsed.reference) {
          parsed.error = parsed.error || "URI is not a " + options.reference + " reference.";
        }
        const schemeHandler = getSchemeHandler(options.scheme || parsed.scheme);
        if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport)) {
          if (parsed.host && (options.domainHost || schemeHandler && schemeHandler.domainHost) && isIP === false && nonSimpleDomain(parsed.host)) {
            try {
              parsed.host = new URL("http://" + parsed.host).hostname;
            } catch (e) {
              parsed.error = parsed.error || "Host's domain name can not be converted to ASCII: " + e;
            }
          }
        }
        if (!schemeHandler || schemeHandler && !schemeHandler.skipNormalize) {
          if (uri.indexOf("%") !== -1) {
            if (parsed.scheme !== void 0) {
              parsed.scheme = unescape(parsed.scheme);
            }
            if (parsed.host !== void 0) {
              parsed.host = reescapeHostDelimiters(unescape(parsed.host), isIP);
            }
          }
          if (parsed.path) {
            parsed.path = normalizePathEncoding(parsed.path);
          }
          if (parsed.fragment) {
            try {
              parsed.fragment = encodeURI(decodeURIComponent(parsed.fragment));
            } catch {
              parsed.error = parsed.error || "URI malformed";
            }
          }
        }
        if (schemeHandler && schemeHandler.parse) {
          schemeHandler.parse(parsed, options);
        }
      } else {
        parsed.error = parsed.error || "URI can not be parsed.";
      }
      return { parsed, malformedAuthorityOrPort };
    }
    function parse(uri, opts) {
      return parseWithStatus(uri, opts).parsed;
    }
    function normalizeString(uri, opts) {
      return normalizeStringWithStatus(uri, opts).normalized;
    }
    function normalizeStringWithStatus(uri, opts) {
      const { parsed, malformedAuthorityOrPort } = parseWithStatus(uri, opts);
      return {
        normalized: malformedAuthorityOrPort ? uri : serialize(parsed, opts),
        malformedAuthorityOrPort
      };
    }
    function normalizeComparableURI(uri, opts) {
      if (typeof uri === "string") {
        const { normalized, malformedAuthorityOrPort } = normalizeStringWithStatus(uri, opts);
        return malformedAuthorityOrPort ? void 0 : normalized;
      }
      if (typeof uri === "object") {
        return serialize(uri, opts);
      }
    }
    var fastUri = {
      SCHEMES,
      normalize: normalize4,
      resolve: resolve18,
      resolveComponent,
      equal,
      serialize,
      parse
    };
    module.exports = fastUri;
    module.exports.default = fastUri;
    module.exports.fastUri = fastUri;
  }
});

// node_modules/ajv/dist/runtime/uri.js
var require_uri = __commonJS({
  "node_modules/ajv/dist/runtime/uri.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var uri = require_fast_uri();
    uri.code = 'require("ajv/dist/runtime/uri").default';
    exports.default = uri;
  }
});

// node_modules/ajv/dist/core.js
var require_core = __commonJS({
  "node_modules/ajv/dist/core.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = void 0;
    var validate_1 = require_validate();
    Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function() {
      return validate_1.KeywordCxt;
    } });
    var codegen_1 = require_codegen();
    Object.defineProperty(exports, "_", { enumerable: true, get: function() {
      return codegen_1._;
    } });
    Object.defineProperty(exports, "str", { enumerable: true, get: function() {
      return codegen_1.str;
    } });
    Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
      return codegen_1.stringify;
    } });
    Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
      return codegen_1.nil;
    } });
    Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
      return codegen_1.Name;
    } });
    Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function() {
      return codegen_1.CodeGen;
    } });
    var validation_error_1 = require_validation_error();
    var ref_error_1 = require_ref_error();
    var rules_1 = require_rules();
    var compile_1 = require_compile();
    var codegen_2 = require_codegen();
    var resolve_1 = require_resolve();
    var dataType_1 = require_dataType();
    var util_1 = require_util();
    var $dataRefSchema = require_data();
    var uri_1 = require_uri();
    var defaultRegExp = (str, flags) => new RegExp(str, flags);
    defaultRegExp.code = "new RegExp";
    var META_IGNORE_OPTIONS = ["removeAdditional", "useDefaults", "coerceTypes"];
    var EXT_SCOPE_NAMES = /* @__PURE__ */ new Set([
      "validate",
      "serialize",
      "parse",
      "wrapper",
      "root",
      "schema",
      "keyword",
      "pattern",
      "formats",
      "validate$data",
      "func",
      "obj",
      "Error"
    ]);
    var removedOptions = {
      errorDataPath: "",
      format: "`validateFormats: false` can be used instead.",
      nullable: '"nullable" keyword is supported by default.',
      jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
      extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
      missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
      processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
      sourceCode: "Use option `code: {source: true}`",
      strictDefaults: "It is default now, see option `strict`.",
      strictKeywords: "It is default now, see option `strict`.",
      uniqueItems: '"uniqueItems" keyword is always validated.',
      unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
      cache: "Map is used as cache, schema object as key.",
      serialize: "Map is used as cache, schema object as key.",
      ajvErrors: "It is default now."
    };
    var deprecatedOptions = {
      ignoreKeywordsWithRef: "",
      jsPropertySyntax: "",
      unicode: '"minLength"/"maxLength" account for unicode characters by default.'
    };
    var MAX_EXPRESSION = 200;
    function requiredOptions(o) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
      const s = o.strict;
      const _optz = (_a = o.code) === null || _a === void 0 ? void 0 : _a.optimize;
      const optimize = _optz === true || _optz === void 0 ? 1 : _optz || 0;
      const regExp = (_c = (_b = o.code) === null || _b === void 0 ? void 0 : _b.regExp) !== null && _c !== void 0 ? _c : defaultRegExp;
      const uriResolver = (_d = o.uriResolver) !== null && _d !== void 0 ? _d : uri_1.default;
      return {
        strictSchema: (_f = (_e = o.strictSchema) !== null && _e !== void 0 ? _e : s) !== null && _f !== void 0 ? _f : true,
        strictNumbers: (_h = (_g = o.strictNumbers) !== null && _g !== void 0 ? _g : s) !== null && _h !== void 0 ? _h : true,
        strictTypes: (_k = (_j = o.strictTypes) !== null && _j !== void 0 ? _j : s) !== null && _k !== void 0 ? _k : "log",
        strictTuples: (_m = (_l = o.strictTuples) !== null && _l !== void 0 ? _l : s) !== null && _m !== void 0 ? _m : "log",
        strictRequired: (_p = (_o = o.strictRequired) !== null && _o !== void 0 ? _o : s) !== null && _p !== void 0 ? _p : false,
        code: o.code ? { ...o.code, optimize, regExp } : { optimize, regExp },
        loopRequired: (_q = o.loopRequired) !== null && _q !== void 0 ? _q : MAX_EXPRESSION,
        loopEnum: (_r = o.loopEnum) !== null && _r !== void 0 ? _r : MAX_EXPRESSION,
        meta: (_s = o.meta) !== null && _s !== void 0 ? _s : true,
        messages: (_t = o.messages) !== null && _t !== void 0 ? _t : true,
        inlineRefs: (_u = o.inlineRefs) !== null && _u !== void 0 ? _u : true,
        schemaId: (_v = o.schemaId) !== null && _v !== void 0 ? _v : "$id",
        addUsedSchema: (_w = o.addUsedSchema) !== null && _w !== void 0 ? _w : true,
        validateSchema: (_x = o.validateSchema) !== null && _x !== void 0 ? _x : true,
        validateFormats: (_y = o.validateFormats) !== null && _y !== void 0 ? _y : true,
        unicodeRegExp: (_z = o.unicodeRegExp) !== null && _z !== void 0 ? _z : true,
        int32range: (_0 = o.int32range) !== null && _0 !== void 0 ? _0 : true,
        uriResolver
      };
    }
    var Ajv = class {
      constructor(opts = {}) {
        this.schemas = {};
        this.refs = {};
        this.formats = /* @__PURE__ */ Object.create(null);
        this._compilations = /* @__PURE__ */ new Set();
        this._loading = {};
        this._cache = /* @__PURE__ */ new Map();
        opts = this.opts = { ...opts, ...requiredOptions(opts) };
        const { es5, lines } = this.opts.code;
        this.scope = new codegen_2.ValueScope({ scope: {}, prefixes: EXT_SCOPE_NAMES, es5, lines });
        this.logger = getLogger(opts.logger);
        const formatOpt = opts.validateFormats;
        opts.validateFormats = false;
        this.RULES = (0, rules_1.getRules)();
        checkOptions.call(this, removedOptions, opts, "NOT SUPPORTED");
        checkOptions.call(this, deprecatedOptions, opts, "DEPRECATED", "warn");
        this._metaOpts = getMetaSchemaOptions.call(this);
        if (opts.formats)
          addInitialFormats.call(this);
        this._addVocabularies();
        this._addDefaultMetaSchema();
        if (opts.keywords)
          addInitialKeywords.call(this, opts.keywords);
        if (typeof opts.meta == "object")
          this.addMetaSchema(opts.meta);
        addInitialSchemas.call(this);
        opts.validateFormats = formatOpt;
      }
      _addVocabularies() {
        this.addKeyword("$async");
      }
      _addDefaultMetaSchema() {
        const { $data, meta, schemaId } = this.opts;
        let _dataRefSchema = $dataRefSchema;
        if (schemaId === "id") {
          _dataRefSchema = { ...$dataRefSchema };
          _dataRefSchema.id = _dataRefSchema.$id;
          delete _dataRefSchema.$id;
        }
        if (meta && $data)
          this.addMetaSchema(_dataRefSchema, _dataRefSchema[schemaId], false);
      }
      defaultMeta() {
        const { meta, schemaId } = this.opts;
        return this.opts.defaultMeta = typeof meta == "object" ? meta[schemaId] || meta : void 0;
      }
      validate(schemaKeyRef, data) {
        let v;
        if (typeof schemaKeyRef == "string") {
          v = this.getSchema(schemaKeyRef);
          if (!v)
            throw new Error(`no schema with key or ref "${schemaKeyRef}"`);
        } else {
          v = this.compile(schemaKeyRef);
        }
        const valid = v(data);
        if (!("$async" in v))
          this.errors = v.errors;
        return valid;
      }
      compile(schema, _meta) {
        const sch = this._addSchema(schema, _meta);
        return sch.validate || this._compileSchemaEnv(sch);
      }
      compileAsync(schema, meta) {
        if (typeof this.opts.loadSchema != "function") {
          throw new Error("options.loadSchema should be a function");
        }
        const { loadSchema } = this.opts;
        return runCompileAsync.call(this, schema, meta);
        async function runCompileAsync(_schema, _meta) {
          await loadMetaSchema.call(this, _schema.$schema);
          const sch = this._addSchema(_schema, _meta);
          return sch.validate || _compileAsync.call(this, sch);
        }
        async function loadMetaSchema($ref) {
          if ($ref && !this.getSchema($ref)) {
            await runCompileAsync.call(this, { $ref }, true);
          }
        }
        async function _compileAsync(sch) {
          try {
            return this._compileSchemaEnv(sch);
          } catch (e) {
            if (!(e instanceof ref_error_1.default))
              throw e;
            checkLoaded.call(this, e);
            await loadMissingSchema.call(this, e.missingSchema);
            return _compileAsync.call(this, sch);
          }
        }
        function checkLoaded({ missingSchema: ref, missingRef }) {
          if (this.refs[ref]) {
            throw new Error(`AnySchema ${ref} is loaded but ${missingRef} cannot be resolved`);
          }
        }
        async function loadMissingSchema(ref) {
          const _schema = await _loadSchema.call(this, ref);
          if (!this.refs[ref])
            await loadMetaSchema.call(this, _schema.$schema);
          if (!this.refs[ref])
            this.addSchema(_schema, ref, meta);
        }
        async function _loadSchema(ref) {
          const p = this._loading[ref];
          if (p)
            return p;
          try {
            return await (this._loading[ref] = loadSchema(ref));
          } finally {
            delete this._loading[ref];
          }
        }
      }
      // Adds schema to the instance
      addSchema(schema, key, _meta, _validateSchema = this.opts.validateSchema) {
        if (Array.isArray(schema)) {
          for (const sch of schema)
            this.addSchema(sch, void 0, _meta, _validateSchema);
          return this;
        }
        let id;
        if (typeof schema === "object") {
          const { schemaId } = this.opts;
          id = schema[schemaId];
          if (id !== void 0 && typeof id != "string") {
            throw new Error(`schema ${schemaId} must be string`);
          }
        }
        key = (0, resolve_1.normalizeId)(key || id);
        this._checkUnique(key);
        this.schemas[key] = this._addSchema(schema, _meta, key, _validateSchema, true);
        return this;
      }
      // Add schema that will be used to validate other schemas
      // options in META_IGNORE_OPTIONS are alway set to false
      addMetaSchema(schema, key, _validateSchema = this.opts.validateSchema) {
        this.addSchema(schema, key, true, _validateSchema);
        return this;
      }
      //  Validate schema against its meta-schema
      validateSchema(schema, throwOrLogError) {
        if (typeof schema == "boolean")
          return true;
        let $schema;
        $schema = schema.$schema;
        if ($schema !== void 0 && typeof $schema != "string") {
          throw new Error("$schema must be a string");
        }
        $schema = $schema || this.opts.defaultMeta || this.defaultMeta();
        if (!$schema) {
          this.logger.warn("meta-schema not available");
          this.errors = null;
          return true;
        }
        const valid = this.validate($schema, schema);
        if (!valid && throwOrLogError) {
          const message = "schema is invalid: " + this.errorsText();
          if (this.opts.validateSchema === "log")
            this.logger.error(message);
          else
            throw new Error(message);
        }
        return valid;
      }
      // Get compiled schema by `key` or `ref`.
      // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
      getSchema(keyRef) {
        let sch;
        while (typeof (sch = getSchEnv.call(this, keyRef)) == "string")
          keyRef = sch;
        if (sch === void 0) {
          const { schemaId } = this.opts;
          const root = new compile_1.SchemaEnv({ schema: {}, schemaId });
          sch = compile_1.resolveSchema.call(this, root, keyRef);
          if (!sch)
            return;
          this.refs[keyRef] = sch;
        }
        return sch.validate || this._compileSchemaEnv(sch);
      }
      // Remove cached schema(s).
      // If no parameter is passed all schemas but meta-schemas are removed.
      // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
      // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
      removeSchema(schemaKeyRef) {
        if (schemaKeyRef instanceof RegExp) {
          this._removeAllSchemas(this.schemas, schemaKeyRef);
          this._removeAllSchemas(this.refs, schemaKeyRef);
          return this;
        }
        switch (typeof schemaKeyRef) {
          case "undefined":
            this._removeAllSchemas(this.schemas);
            this._removeAllSchemas(this.refs);
            this._cache.clear();
            return this;
          case "string": {
            const sch = getSchEnv.call(this, schemaKeyRef);
            if (typeof sch == "object")
              this._cache.delete(sch.schema);
            delete this.schemas[schemaKeyRef];
            delete this.refs[schemaKeyRef];
            return this;
          }
          case "object": {
            const cacheKey = schemaKeyRef;
            this._cache.delete(cacheKey);
            let id = schemaKeyRef[this.opts.schemaId];
            if (id) {
              id = (0, resolve_1.normalizeId)(id);
              delete this.schemas[id];
              delete this.refs[id];
            }
            return this;
          }
          default:
            throw new Error("ajv.removeSchema: invalid parameter");
        }
      }
      // add "vocabulary" - a collection of keywords
      addVocabulary(definitions) {
        for (const def of definitions)
          this.addKeyword(def);
        return this;
      }
      addKeyword(kwdOrDef, def) {
        let keyword;
        if (typeof kwdOrDef == "string") {
          keyword = kwdOrDef;
          if (typeof def == "object") {
            this.logger.warn("these parameters are deprecated, see docs for addKeyword");
            def.keyword = keyword;
          }
        } else if (typeof kwdOrDef == "object" && def === void 0) {
          def = kwdOrDef;
          keyword = def.keyword;
          if (Array.isArray(keyword) && !keyword.length) {
            throw new Error("addKeywords: keyword must be string or non-empty array");
          }
        } else {
          throw new Error("invalid addKeywords parameters");
        }
        checkKeyword.call(this, keyword, def);
        if (!def) {
          (0, util_1.eachItem)(keyword, (kwd) => addRule.call(this, kwd));
          return this;
        }
        keywordMetaschema.call(this, def);
        const definition = {
          ...def,
          type: (0, dataType_1.getJSONTypes)(def.type),
          schemaType: (0, dataType_1.getJSONTypes)(def.schemaType)
        };
        (0, util_1.eachItem)(keyword, definition.type.length === 0 ? (k) => addRule.call(this, k, definition) : (k) => definition.type.forEach((t) => addRule.call(this, k, definition, t)));
        return this;
      }
      getKeyword(keyword) {
        const rule = this.RULES.all[keyword];
        return typeof rule == "object" ? rule.definition : !!rule;
      }
      // Remove keyword
      removeKeyword(keyword) {
        const { RULES } = this;
        delete RULES.keywords[keyword];
        delete RULES.all[keyword];
        for (const group of RULES.rules) {
          const i = group.rules.findIndex((rule) => rule.keyword === keyword);
          if (i >= 0)
            group.rules.splice(i, 1);
        }
        return this;
      }
      // Add format
      addFormat(name, format) {
        if (typeof format == "string")
          format = new RegExp(format);
        this.formats[name] = format;
        return this;
      }
      errorsText(errors = this.errors, { separator = ", ", dataVar = "data" } = {}) {
        if (!errors || errors.length === 0)
          return "No errors";
        return errors.map((e) => `${dataVar}${e.instancePath} ${e.message}`).reduce((text, msg) => text + separator + msg);
      }
      $dataMetaSchema(metaSchema, keywordsJsonPointers) {
        const rules = this.RULES.all;
        metaSchema = JSON.parse(JSON.stringify(metaSchema));
        for (const jsonPointer of keywordsJsonPointers) {
          const segments = jsonPointer.split("/").slice(1);
          let keywords = metaSchema;
          for (const seg of segments)
            keywords = keywords[seg];
          for (const key in rules) {
            const rule = rules[key];
            if (typeof rule != "object")
              continue;
            const { $data } = rule.definition;
            const schema = keywords[key];
            if ($data && schema)
              keywords[key] = schemaOrData(schema);
          }
        }
        return metaSchema;
      }
      _removeAllSchemas(schemas2, regex) {
        for (const keyRef in schemas2) {
          const sch = schemas2[keyRef];
          if (!regex || regex.test(keyRef)) {
            if (typeof sch == "string") {
              delete schemas2[keyRef];
            } else if (sch && !sch.meta) {
              this._cache.delete(sch.schema);
              delete schemas2[keyRef];
            }
          }
        }
      }
      _addSchema(schema, meta, baseId, validateSchema = this.opts.validateSchema, addSchema = this.opts.addUsedSchema) {
        let id;
        const { schemaId } = this.opts;
        if (typeof schema == "object") {
          id = schema[schemaId];
        } else {
          if (this.opts.jtd)
            throw new Error("schema must be object");
          else if (typeof schema != "boolean")
            throw new Error("schema must be object or boolean");
        }
        let sch = this._cache.get(schema);
        if (sch !== void 0)
          return sch;
        baseId = (0, resolve_1.normalizeId)(id || baseId);
        const localRefs = resolve_1.getSchemaRefs.call(this, schema, baseId);
        sch = new compile_1.SchemaEnv({ schema, schemaId, meta, baseId, localRefs });
        this._cache.set(sch.schema, sch);
        if (addSchema && !baseId.startsWith("#")) {
          if (baseId)
            this._checkUnique(baseId);
          this.refs[baseId] = sch;
        }
        if (validateSchema)
          this.validateSchema(schema, true);
        return sch;
      }
      _checkUnique(id) {
        if (this.schemas[id] || this.refs[id]) {
          throw new Error(`schema with key or id "${id}" already exists`);
        }
      }
      _compileSchemaEnv(sch) {
        if (sch.meta)
          this._compileMetaSchema(sch);
        else
          compile_1.compileSchema.call(this, sch);
        if (!sch.validate)
          throw new Error("ajv implementation error");
        return sch.validate;
      }
      _compileMetaSchema(sch) {
        const currentOpts = this.opts;
        this.opts = this._metaOpts;
        try {
          compile_1.compileSchema.call(this, sch);
        } finally {
          this.opts = currentOpts;
        }
      }
    };
    Ajv.ValidationError = validation_error_1.default;
    Ajv.MissingRefError = ref_error_1.default;
    exports.default = Ajv;
    function checkOptions(checkOpts, options, msg, log = "error") {
      for (const key in checkOpts) {
        const opt = key;
        if (opt in options)
          this.logger[log](`${msg}: option ${key}. ${checkOpts[opt]}`);
      }
    }
    function getSchEnv(keyRef) {
      keyRef = (0, resolve_1.normalizeId)(keyRef);
      return this.schemas[keyRef] || this.refs[keyRef];
    }
    function addInitialSchemas() {
      const optsSchemas = this.opts.schemas;
      if (!optsSchemas)
        return;
      if (Array.isArray(optsSchemas))
        this.addSchema(optsSchemas);
      else
        for (const key in optsSchemas)
          this.addSchema(optsSchemas[key], key);
    }
    function addInitialFormats() {
      for (const name in this.opts.formats) {
        const format = this.opts.formats[name];
        if (format)
          this.addFormat(name, format);
      }
    }
    function addInitialKeywords(defs) {
      if (Array.isArray(defs)) {
        this.addVocabulary(defs);
        return;
      }
      this.logger.warn("keywords option as map is deprecated, pass array");
      for (const keyword in defs) {
        const def = defs[keyword];
        if (!def.keyword)
          def.keyword = keyword;
        this.addKeyword(def);
      }
    }
    function getMetaSchemaOptions() {
      const metaOpts = { ...this.opts };
      for (const opt of META_IGNORE_OPTIONS)
        delete metaOpts[opt];
      return metaOpts;
    }
    var noLogs = { log() {
    }, warn() {
    }, error() {
    } };
    function getLogger(logger) {
      if (logger === false)
        return noLogs;
      if (logger === void 0)
        return console;
      if (logger.log && logger.warn && logger.error)
        return logger;
      throw new Error("logger must implement log, warn and error methods");
    }
    var KEYWORD_NAME = /^[a-z_$][a-z0-9_$:-]*$/i;
    function checkKeyword(keyword, def) {
      const { RULES } = this;
      (0, util_1.eachItem)(keyword, (kwd) => {
        if (RULES.keywords[kwd])
          throw new Error(`Keyword ${kwd} is already defined`);
        if (!KEYWORD_NAME.test(kwd))
          throw new Error(`Keyword ${kwd} has invalid name`);
      });
      if (!def)
        return;
      if (def.$data && !("code" in def || "validate" in def)) {
        throw new Error('$data keyword must have "code" or "validate" function');
      }
    }
    function addRule(keyword, definition, dataType) {
      var _a;
      const post = definition === null || definition === void 0 ? void 0 : definition.post;
      if (dataType && post)
        throw new Error('keyword with "post" flag cannot have "type"');
      const { RULES } = this;
      let ruleGroup = post ? RULES.post : RULES.rules.find(({ type: t }) => t === dataType);
      if (!ruleGroup) {
        ruleGroup = { type: dataType, rules: [] };
        RULES.rules.push(ruleGroup);
      }
      RULES.keywords[keyword] = true;
      if (!definition)
        return;
      const rule = {
        keyword,
        definition: {
          ...definition,
          type: (0, dataType_1.getJSONTypes)(definition.type),
          schemaType: (0, dataType_1.getJSONTypes)(definition.schemaType)
        }
      };
      if (definition.before)
        addBeforeRule.call(this, ruleGroup, rule, definition.before);
      else
        ruleGroup.rules.push(rule);
      RULES.all[keyword] = rule;
      (_a = definition.implements) === null || _a === void 0 ? void 0 : _a.forEach((kwd) => this.addKeyword(kwd));
    }
    function addBeforeRule(ruleGroup, rule, before) {
      const i = ruleGroup.rules.findIndex((_rule) => _rule.keyword === before);
      if (i >= 0) {
        ruleGroup.rules.splice(i, 0, rule);
      } else {
        ruleGroup.rules.push(rule);
        this.logger.warn(`rule ${before} is not defined`);
      }
    }
    function keywordMetaschema(def) {
      let { metaSchema } = def;
      if (metaSchema === void 0)
        return;
      if (def.$data && this.opts.$data)
        metaSchema = schemaOrData(metaSchema);
      def.validateSchema = this.compile(metaSchema, true);
    }
    var $dataRef = {
      $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
    };
    function schemaOrData(schema) {
      return { anyOf: [schema, $dataRef] };
    }
  }
});

// node_modules/ajv/dist/vocabularies/core/id.js
var require_id = __commonJS({
  "node_modules/ajv/dist/vocabularies/core/id.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var def = {
      keyword: "id",
      code() {
        throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/core/ref.js
var require_ref = __commonJS({
  "node_modules/ajv/dist/vocabularies/core/ref.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.callRef = exports.getValidate = void 0;
    var ref_error_1 = require_ref_error();
    var code_1 = require_code2();
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var compile_1 = require_compile();
    var util_1 = require_util();
    var def = {
      keyword: "$ref",
      schemaType: "string",
      code(cxt) {
        const { gen, schema: $ref, it } = cxt;
        const { baseId, schemaEnv: env, validateName, opts, self } = it;
        const { root } = env;
        if (($ref === "#" || $ref === "#/") && baseId === root.baseId)
          return callRootRef();
        const schOrEnv = compile_1.resolveRef.call(self, root, baseId, $ref);
        if (schOrEnv === void 0)
          throw new ref_error_1.default(it.opts.uriResolver, baseId, $ref);
        if (schOrEnv instanceof compile_1.SchemaEnv)
          return callValidate(schOrEnv);
        return inlineRefSchema(schOrEnv);
        function callRootRef() {
          if (env === root)
            return callRef(cxt, validateName, env, env.$async);
          const rootName = gen.scopeValue("root", { ref: root });
          return callRef(cxt, (0, codegen_1._)`${rootName}.validate`, root, root.$async);
        }
        function callValidate(sch) {
          const v = getValidate(cxt, sch);
          callRef(cxt, v, sch, sch.$async);
        }
        function inlineRefSchema(sch) {
          const schName = gen.scopeValue("schema", opts.code.source === true ? { ref: sch, code: (0, codegen_1.stringify)(sch) } : { ref: sch });
          const valid = gen.name("valid");
          const schCxt = cxt.subschema({
            schema: sch,
            dataTypes: [],
            schemaPath: codegen_1.nil,
            topSchemaRef: schName,
            errSchemaPath: $ref
          }, valid);
          cxt.mergeEvaluated(schCxt);
          cxt.ok(valid);
        }
      }
    };
    function getValidate(cxt, sch) {
      const { gen } = cxt;
      return sch.validate ? gen.scopeValue("validate", { ref: sch.validate }) : (0, codegen_1._)`${gen.scopeValue("wrapper", { ref: sch })}.validate`;
    }
    exports.getValidate = getValidate;
    function callRef(cxt, v, sch, $async) {
      const { gen, it } = cxt;
      const { allErrors, schemaEnv: env, opts } = it;
      const passCxt = opts.passContext ? names_1.default.this : codegen_1.nil;
      if ($async)
        callAsyncRef();
      else
        callSyncRef();
      function callAsyncRef() {
        if (!env.$async)
          throw new Error("async schema referenced by sync schema");
        const valid = gen.let("valid");
        gen.try(() => {
          gen.code((0, codegen_1._)`await ${(0, code_1.callValidateCode)(cxt, v, passCxt)}`);
          addEvaluatedFrom(v);
          if (!allErrors)
            gen.assign(valid, true);
        }, (e) => {
          gen.if((0, codegen_1._)`!(${e} instanceof ${it.ValidationError})`, () => gen.throw(e));
          addErrorsFrom(e);
          if (!allErrors)
            gen.assign(valid, false);
        });
        cxt.ok(valid);
      }
      function callSyncRef() {
        cxt.result((0, code_1.callValidateCode)(cxt, v, passCxt), () => addEvaluatedFrom(v), () => addErrorsFrom(v));
      }
      function addErrorsFrom(source) {
        const errs = (0, codegen_1._)`${source}.errors`;
        gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`);
        gen.assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
      }
      function addEvaluatedFrom(source) {
        var _a;
        if (!it.opts.unevaluated)
          return;
        const schEvaluated = (_a = sch === null || sch === void 0 ? void 0 : sch.validate) === null || _a === void 0 ? void 0 : _a.evaluated;
        if (it.props !== true) {
          if (schEvaluated && !schEvaluated.dynamicProps) {
            if (schEvaluated.props !== void 0) {
              it.props = util_1.mergeEvaluated.props(gen, schEvaluated.props, it.props);
            }
          } else {
            const props = gen.var("props", (0, codegen_1._)`${source}.evaluated.props`);
            it.props = util_1.mergeEvaluated.props(gen, props, it.props, codegen_1.Name);
          }
        }
        if (it.items !== true) {
          if (schEvaluated && !schEvaluated.dynamicItems) {
            if (schEvaluated.items !== void 0) {
              it.items = util_1.mergeEvaluated.items(gen, schEvaluated.items, it.items);
            }
          } else {
            const items = gen.var("items", (0, codegen_1._)`${source}.evaluated.items`);
            it.items = util_1.mergeEvaluated.items(gen, items, it.items, codegen_1.Name);
          }
        }
      }
    }
    exports.callRef = callRef;
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/core/index.js
var require_core2 = __commonJS({
  "node_modules/ajv/dist/vocabularies/core/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var id_1 = require_id();
    var ref_1 = require_ref();
    var core = [
      "$schema",
      "$id",
      "$defs",
      "$vocabulary",
      { keyword: "$comment" },
      "definitions",
      id_1.default,
      ref_1.default
    ];
    exports.default = core;
  }
});

// node_modules/ajv/dist/vocabularies/validation/limitNumber.js
var require_limitNumber = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/limitNumber.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var ops = codegen_1.operators;
    var KWDs = {
      maximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
      minimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
      exclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
      exclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE }
    };
    var error = {
      message: ({ keyword, schemaCode }) => (0, codegen_1.str)`must be ${KWDs[keyword].okStr} ${schemaCode}`,
      params: ({ keyword, schemaCode }) => (0, codegen_1._)`{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`
    };
    var def = {
      keyword: Object.keys(KWDs),
      type: "number",
      schemaType: "number",
      $data: true,
      error,
      code(cxt) {
        const { keyword, data, schemaCode } = cxt;
        cxt.fail$data((0, codegen_1._)`${data} ${KWDs[keyword].fail} ${schemaCode} || isNaN(${data})`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/multipleOf.js
var require_multipleOf = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/multipleOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var error = {
      message: ({ schemaCode }) => (0, codegen_1.str)`must be multiple of ${schemaCode}`,
      params: ({ schemaCode }) => (0, codegen_1._)`{multipleOf: ${schemaCode}}`
    };
    var def = {
      keyword: "multipleOf",
      type: "number",
      schemaType: "number",
      $data: true,
      error,
      code(cxt) {
        const { gen, data, schemaCode, it } = cxt;
        const prec = it.opts.multipleOfPrecision;
        const res = gen.let("res");
        const invalid = prec ? (0, codegen_1._)`Math.abs(Math.round(${res}) - ${res}) > 1e-${prec}` : (0, codegen_1._)`${res} !== parseInt(${res})`;
        cxt.fail$data((0, codegen_1._)`(${schemaCode} === 0 || (${res} = ${data}/${schemaCode}, ${invalid}))`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/runtime/ucs2length.js
var require_ucs2length = __commonJS({
  "node_modules/ajv/dist/runtime/ucs2length.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function ucs2length(str) {
      const len = str.length;
      let length = 0;
      let pos = 0;
      let value;
      while (pos < len) {
        length++;
        value = str.charCodeAt(pos++);
        if (value >= 55296 && value <= 56319 && pos < len) {
          value = str.charCodeAt(pos);
          if ((value & 64512) === 56320)
            pos++;
        }
      }
      return length;
    }
    exports.default = ucs2length;
    ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
  }
});

// node_modules/ajv/dist/vocabularies/validation/limitLength.js
var require_limitLength = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/limitLength.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var ucs2length_1 = require_ucs2length();
    var error = {
      message({ keyword, schemaCode }) {
        const comp = keyword === "maxLength" ? "more" : "fewer";
        return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} characters`;
      },
      params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
    };
    var def = {
      keyword: ["maxLength", "minLength"],
      type: "string",
      schemaType: "number",
      $data: true,
      error,
      code(cxt) {
        const { keyword, data, schemaCode, it } = cxt;
        const op = keyword === "maxLength" ? codegen_1.operators.GT : codegen_1.operators.LT;
        const len = it.opts.unicode === false ? (0, codegen_1._)`${data}.length` : (0, codegen_1._)`${(0, util_1.useFunc)(cxt.gen, ucs2length_1.default)}(${data})`;
        cxt.fail$data((0, codegen_1._)`${len} ${op} ${schemaCode}`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/pattern.js
var require_pattern = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/pattern.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var util_1 = require_util();
    var codegen_1 = require_codegen();
    var error = {
      message: ({ schemaCode }) => (0, codegen_1.str)`must match pattern "${schemaCode}"`,
      params: ({ schemaCode }) => (0, codegen_1._)`{pattern: ${schemaCode}}`
    };
    var def = {
      keyword: "pattern",
      type: "string",
      schemaType: "string",
      $data: true,
      error,
      code(cxt) {
        const { gen, data, $data, schema, schemaCode, it } = cxt;
        const u = it.opts.unicodeRegExp ? "u" : "";
        if ($data) {
          const { regExp } = it.opts.code;
          const regExpCode = regExp.code === "new RegExp" ? (0, codegen_1._)`new RegExp` : (0, util_1.useFunc)(gen, regExp);
          const valid = gen.let("valid");
          gen.try(() => gen.assign(valid, (0, codegen_1._)`${regExpCode}(${schemaCode}, ${u}).test(${data})`), () => gen.assign(valid, false));
          cxt.fail$data((0, codegen_1._)`!${valid}`);
        } else {
          const regExp = (0, code_1.usePattern)(cxt, schema);
          cxt.fail$data((0, codegen_1._)`!${regExp}.test(${data})`);
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/limitProperties.js
var require_limitProperties = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/limitProperties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var error = {
      message({ keyword, schemaCode }) {
        const comp = keyword === "maxProperties" ? "more" : "fewer";
        return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} properties`;
      },
      params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
    };
    var def = {
      keyword: ["maxProperties", "minProperties"],
      type: "object",
      schemaType: "number",
      $data: true,
      error,
      code(cxt) {
        const { keyword, data, schemaCode } = cxt;
        const op = keyword === "maxProperties" ? codegen_1.operators.GT : codegen_1.operators.LT;
        cxt.fail$data((0, codegen_1._)`Object.keys(${data}).length ${op} ${schemaCode}`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/required.js
var require_required = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/required.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error = {
      message: ({ params: { missingProperty } }) => (0, codegen_1.str)`must have required property '${missingProperty}'`,
      params: ({ params: { missingProperty } }) => (0, codegen_1._)`{missingProperty: ${missingProperty}}`
    };
    var def = {
      keyword: "required",
      type: "object",
      schemaType: "array",
      $data: true,
      error,
      code(cxt) {
        const { gen, schema, schemaCode, data, $data, it } = cxt;
        const { opts } = it;
        if (!$data && schema.length === 0)
          return;
        const useLoop = schema.length >= opts.loopRequired;
        if (it.allErrors)
          allErrorsMode();
        else
          exitOnErrorMode();
        if (opts.strictRequired) {
          const props = cxt.parentSchema.properties;
          const { definedProperties } = cxt.it;
          for (const requiredKey of schema) {
            if ((props === null || props === void 0 ? void 0 : props[requiredKey]) === void 0 && !definedProperties.has(requiredKey)) {
              const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
              const msg = `required property "${requiredKey}" is not defined at "${schemaPath}" (strictRequired)`;
              (0, util_1.checkStrictMode)(it, msg, it.opts.strictRequired);
            }
          }
        }
        function allErrorsMode() {
          if (useLoop || $data) {
            cxt.block$data(codegen_1.nil, loopAllRequired);
          } else {
            for (const prop of schema) {
              (0, code_1.checkReportMissingProp)(cxt, prop);
            }
          }
        }
        function exitOnErrorMode() {
          const missing = gen.let("missing");
          if (useLoop || $data) {
            const valid = gen.let("valid", true);
            cxt.block$data(valid, () => loopUntilMissing(missing, valid));
            cxt.ok(valid);
          } else {
            gen.if((0, code_1.checkMissingProp)(cxt, schema, missing));
            (0, code_1.reportMissingProp)(cxt, missing);
            gen.else();
          }
        }
        function loopAllRequired() {
          gen.forOf("prop", schemaCode, (prop) => {
            cxt.setParams({ missingProperty: prop });
            gen.if((0, code_1.noPropertyInData)(gen, data, prop, opts.ownProperties), () => cxt.error());
          });
        }
        function loopUntilMissing(missing, valid) {
          cxt.setParams({ missingProperty: missing });
          gen.forOf(missing, schemaCode, () => {
            gen.assign(valid, (0, code_1.propertyInData)(gen, data, missing, opts.ownProperties));
            gen.if((0, codegen_1.not)(valid), () => {
              cxt.error();
              gen.break();
            });
          }, codegen_1.nil);
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/limitItems.js
var require_limitItems = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/limitItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var error = {
      message({ keyword, schemaCode }) {
        const comp = keyword === "maxItems" ? "more" : "fewer";
        return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} items`;
      },
      params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
    };
    var def = {
      keyword: ["maxItems", "minItems"],
      type: "array",
      schemaType: "number",
      $data: true,
      error,
      code(cxt) {
        const { keyword, data, schemaCode } = cxt;
        const op = keyword === "maxItems" ? codegen_1.operators.GT : codegen_1.operators.LT;
        cxt.fail$data((0, codegen_1._)`${data}.length ${op} ${schemaCode}`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/runtime/equal.js
var require_equal = __commonJS({
  "node_modules/ajv/dist/runtime/equal.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var equal = require_fast_deep_equal();
    equal.code = 'require("ajv/dist/runtime/equal").default';
    exports.default = equal;
  }
});

// node_modules/ajv/dist/vocabularies/validation/uniqueItems.js
var require_uniqueItems = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/uniqueItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var dataType_1 = require_dataType();
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var equal_1 = require_equal();
    var error = {
      message: ({ params: { i, j } }) => (0, codegen_1.str)`must NOT have duplicate items (items ## ${j} and ${i} are identical)`,
      params: ({ params: { i, j } }) => (0, codegen_1._)`{i: ${i}, j: ${j}}`
    };
    var def = {
      keyword: "uniqueItems",
      type: "array",
      schemaType: "boolean",
      $data: true,
      error,
      code(cxt) {
        const { gen, data, $data, schema, parentSchema, schemaCode, it } = cxt;
        if (!$data && !schema)
          return;
        const valid = gen.let("valid");
        const itemTypes = parentSchema.items ? (0, dataType_1.getSchemaTypes)(parentSchema.items) : [];
        cxt.block$data(valid, validateUniqueItems, (0, codegen_1._)`${schemaCode} === false`);
        cxt.ok(valid);
        function validateUniqueItems() {
          const i = gen.let("i", (0, codegen_1._)`${data}.length`);
          const j = gen.let("j");
          cxt.setParams({ i, j });
          gen.assign(valid, true);
          gen.if((0, codegen_1._)`${i} > 1`, () => (canOptimize() ? loopN : loopN2)(i, j));
        }
        function canOptimize() {
          return itemTypes.length > 0 && !itemTypes.some((t) => t === "object" || t === "array");
        }
        function loopN(i, j) {
          const item = gen.name("item");
          const wrongType = (0, dataType_1.checkDataTypes)(itemTypes, item, it.opts.strictNumbers, dataType_1.DataType.Wrong);
          const indices = gen.const("indices", (0, codegen_1._)`{}`);
          gen.for((0, codegen_1._)`;${i}--;`, () => {
            gen.let(item, (0, codegen_1._)`${data}[${i}]`);
            gen.if(wrongType, (0, codegen_1._)`continue`);
            if (itemTypes.length > 1)
              gen.if((0, codegen_1._)`typeof ${item} == "string"`, (0, codegen_1._)`${item} += "_"`);
            gen.if((0, codegen_1._)`typeof ${indices}[${item}] == "number"`, () => {
              gen.assign(j, (0, codegen_1._)`${indices}[${item}]`);
              cxt.error();
              gen.assign(valid, false).break();
            }).code((0, codegen_1._)`${indices}[${item}] = ${i}`);
          });
        }
        function loopN2(i, j) {
          const eql = (0, util_1.useFunc)(gen, equal_1.default);
          const outer = gen.name("outer");
          gen.label(outer).for((0, codegen_1._)`;${i}--;`, () => gen.for((0, codegen_1._)`${j} = ${i}; ${j}--;`, () => gen.if((0, codegen_1._)`${eql}(${data}[${i}], ${data}[${j}])`, () => {
            cxt.error();
            gen.assign(valid, false).break(outer);
          })));
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/const.js
var require_const = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/const.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var equal_1 = require_equal();
    var error = {
      message: "must be equal to constant",
      params: ({ schemaCode }) => (0, codegen_1._)`{allowedValue: ${schemaCode}}`
    };
    var def = {
      keyword: "const",
      $data: true,
      error,
      code(cxt) {
        const { gen, data, $data, schemaCode, schema } = cxt;
        if ($data || schema && typeof schema == "object") {
          cxt.fail$data((0, codegen_1._)`!${(0, util_1.useFunc)(gen, equal_1.default)}(${data}, ${schemaCode})`);
        } else {
          cxt.fail((0, codegen_1._)`${schema} !== ${data}`);
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/enum.js
var require_enum = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/enum.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var equal_1 = require_equal();
    var error = {
      message: "must be equal to one of the allowed values",
      params: ({ schemaCode }) => (0, codegen_1._)`{allowedValues: ${schemaCode}}`
    };
    var def = {
      keyword: "enum",
      schemaType: "array",
      $data: true,
      error,
      code(cxt) {
        const { gen, data, $data, schema, schemaCode, it } = cxt;
        if (!$data && schema.length === 0)
          throw new Error("enum must have non-empty array");
        const useLoop = schema.length >= it.opts.loopEnum;
        let eql;
        const getEql = () => eql !== null && eql !== void 0 ? eql : eql = (0, util_1.useFunc)(gen, equal_1.default);
        let valid;
        if (useLoop || $data) {
          valid = gen.let("valid");
          cxt.block$data(valid, loopEnum);
        } else {
          if (!Array.isArray(schema))
            throw new Error("ajv implementation error");
          const vSchema = gen.const("vSchema", schemaCode);
          valid = (0, codegen_1.or)(...schema.map((_x, i) => equalCode(vSchema, i)));
        }
        cxt.pass(valid);
        function loopEnum() {
          gen.assign(valid, false);
          gen.forOf("v", schemaCode, (v) => gen.if((0, codegen_1._)`${getEql()}(${data}, ${v})`, () => gen.assign(valid, true).break()));
        }
        function equalCode(vSchema, i) {
          const sch = schema[i];
          return typeof sch === "object" && sch !== null ? (0, codegen_1._)`${getEql()}(${data}, ${vSchema}[${i}])` : (0, codegen_1._)`${data} === ${sch}`;
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/index.js
var require_validation = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var limitNumber_1 = require_limitNumber();
    var multipleOf_1 = require_multipleOf();
    var limitLength_1 = require_limitLength();
    var pattern_1 = require_pattern();
    var limitProperties_1 = require_limitProperties();
    var required_1 = require_required();
    var limitItems_1 = require_limitItems();
    var uniqueItems_1 = require_uniqueItems();
    var const_1 = require_const();
    var enum_1 = require_enum();
    var validation = [
      // number
      limitNumber_1.default,
      multipleOf_1.default,
      // string
      limitLength_1.default,
      pattern_1.default,
      // object
      limitProperties_1.default,
      required_1.default,
      // array
      limitItems_1.default,
      uniqueItems_1.default,
      // any
      { keyword: "type", schemaType: ["string", "array"] },
      { keyword: "nullable", schemaType: "boolean" },
      const_1.default,
      enum_1.default
    ];
    exports.default = validation;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/additionalItems.js
var require_additionalItems = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/additionalItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateAdditionalItems = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error = {
      message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
      params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
    };
    var def = {
      keyword: "additionalItems",
      type: "array",
      schemaType: ["boolean", "object"],
      before: "uniqueItems",
      error,
      code(cxt) {
        const { parentSchema, it } = cxt;
        const { items } = parentSchema;
        if (!Array.isArray(items)) {
          (0, util_1.checkStrictMode)(it, '"additionalItems" is ignored when "items" is not an array of schemas');
          return;
        }
        validateAdditionalItems(cxt, items);
      }
    };
    function validateAdditionalItems(cxt, items) {
      const { gen, schema, data, keyword, it } = cxt;
      it.items = true;
      const len = gen.const("len", (0, codegen_1._)`${data}.length`);
      if (schema === false) {
        cxt.setParams({ len: items.length });
        cxt.pass((0, codegen_1._)`${len} <= ${items.length}`);
      } else if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
        const valid = gen.var("valid", (0, codegen_1._)`${len} <= ${items.length}`);
        gen.if((0, codegen_1.not)(valid), () => validateItems(valid));
        cxt.ok(valid);
      }
      function validateItems(valid) {
        gen.forRange("i", items.length, len, (i) => {
          cxt.subschema({ keyword, dataProp: i, dataPropType: util_1.Type.Num }, valid);
          if (!it.allErrors)
            gen.if((0, codegen_1.not)(valid), () => gen.break());
        });
      }
    }
    exports.validateAdditionalItems = validateAdditionalItems;
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/items.js
var require_items = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/items.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateTuple = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var code_1 = require_code2();
    var def = {
      keyword: "items",
      type: "array",
      schemaType: ["object", "array", "boolean"],
      before: "uniqueItems",
      code(cxt) {
        const { schema, it } = cxt;
        if (Array.isArray(schema))
          return validateTuple(cxt, "additionalItems", schema);
        it.items = true;
        if ((0, util_1.alwaysValidSchema)(it, schema))
          return;
        cxt.ok((0, code_1.validateArray)(cxt));
      }
    };
    function validateTuple(cxt, extraItems, schArr = cxt.schema) {
      const { gen, parentSchema, data, keyword, it } = cxt;
      checkStrictTuple(parentSchema);
      if (it.opts.unevaluated && schArr.length && it.items !== true) {
        it.items = util_1.mergeEvaluated.items(gen, schArr.length, it.items);
      }
      const valid = gen.name("valid");
      const len = gen.const("len", (0, codegen_1._)`${data}.length`);
      schArr.forEach((sch, i) => {
        if ((0, util_1.alwaysValidSchema)(it, sch))
          return;
        gen.if((0, codegen_1._)`${len} > ${i}`, () => cxt.subschema({
          keyword,
          schemaProp: i,
          dataProp: i
        }, valid));
        cxt.ok(valid);
      });
      function checkStrictTuple(sch) {
        const { opts, errSchemaPath } = it;
        const l = schArr.length;
        const fullTuple = l === sch.minItems && (l === sch.maxItems || sch[extraItems] === false);
        if (opts.strictTuples && !fullTuple) {
          const msg = `"${keyword}" is ${l}-tuple, but minItems or maxItems/${extraItems} are not specified or different at path "${errSchemaPath}"`;
          (0, util_1.checkStrictMode)(it, msg, opts.strictTuples);
        }
      }
    }
    exports.validateTuple = validateTuple;
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/prefixItems.js
var require_prefixItems = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/prefixItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var items_1 = require_items();
    var def = {
      keyword: "prefixItems",
      type: "array",
      schemaType: ["array"],
      before: "uniqueItems",
      code: (cxt) => (0, items_1.validateTuple)(cxt, "items")
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/items2020.js
var require_items2020 = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/items2020.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var code_1 = require_code2();
    var additionalItems_1 = require_additionalItems();
    var error = {
      message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
      params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
    };
    var def = {
      keyword: "items",
      type: "array",
      schemaType: ["object", "boolean"],
      before: "uniqueItems",
      error,
      code(cxt) {
        const { schema, parentSchema, it } = cxt;
        const { prefixItems } = parentSchema;
        it.items = true;
        if ((0, util_1.alwaysValidSchema)(it, schema))
          return;
        if (prefixItems)
          (0, additionalItems_1.validateAdditionalItems)(cxt, prefixItems);
        else
          cxt.ok((0, code_1.validateArray)(cxt));
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/contains.js
var require_contains = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/contains.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error = {
      message: ({ params: { min, max } }) => max === void 0 ? (0, codegen_1.str)`must contain at least ${min} valid item(s)` : (0, codegen_1.str)`must contain at least ${min} and no more than ${max} valid item(s)`,
      params: ({ params: { min, max } }) => max === void 0 ? (0, codegen_1._)`{minContains: ${min}}` : (0, codegen_1._)`{minContains: ${min}, maxContains: ${max}}`
    };
    var def = {
      keyword: "contains",
      type: "array",
      schemaType: ["object", "boolean"],
      before: "uniqueItems",
      trackErrors: true,
      error,
      code(cxt) {
        const { gen, schema, parentSchema, data, it } = cxt;
        let min;
        let max;
        const { minContains, maxContains } = parentSchema;
        if (it.opts.next) {
          min = minContains === void 0 ? 1 : minContains;
          max = maxContains;
        } else {
          min = 1;
        }
        const len = gen.const("len", (0, codegen_1._)`${data}.length`);
        cxt.setParams({ min, max });
        if (max === void 0 && min === 0) {
          (0, util_1.checkStrictMode)(it, `"minContains" == 0 without "maxContains": "contains" keyword ignored`);
          return;
        }
        if (max !== void 0 && min > max) {
          (0, util_1.checkStrictMode)(it, `"minContains" > "maxContains" is always invalid`);
          cxt.fail();
          return;
        }
        if ((0, util_1.alwaysValidSchema)(it, schema)) {
          let cond = (0, codegen_1._)`${len} >= ${min}`;
          if (max !== void 0)
            cond = (0, codegen_1._)`${cond} && ${len} <= ${max}`;
          cxt.pass(cond);
          return;
        }
        it.items = true;
        const valid = gen.name("valid");
        if (max === void 0 && min === 1) {
          validateItems(valid, () => gen.if(valid, () => gen.break()));
        } else if (min === 0) {
          gen.let(valid, true);
          if (max !== void 0)
            gen.if((0, codegen_1._)`${data}.length > 0`, validateItemsWithCount);
        } else {
          gen.let(valid, false);
          validateItemsWithCount();
        }
        cxt.result(valid, () => cxt.reset());
        function validateItemsWithCount() {
          const schValid = gen.name("_valid");
          const count = gen.let("count", 0);
          validateItems(schValid, () => gen.if(schValid, () => checkLimits(count)));
        }
        function validateItems(_valid, block) {
          gen.forRange("i", 0, len, (i) => {
            cxt.subschema({
              keyword: "contains",
              dataProp: i,
              dataPropType: util_1.Type.Num,
              compositeRule: true
            }, _valid);
            block();
          });
        }
        function checkLimits(count) {
          gen.code((0, codegen_1._)`${count}++`);
          if (max === void 0) {
            gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true).break());
          } else {
            gen.if((0, codegen_1._)`${count} > ${max}`, () => gen.assign(valid, false).break());
            if (min === 1)
              gen.assign(valid, true);
            else
              gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true));
          }
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/dependencies.js
var require_dependencies = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/dependencies.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateSchemaDeps = exports.validatePropertyDeps = exports.error = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var code_1 = require_code2();
    exports.error = {
      message: ({ params: { property, depsCount, deps } }) => {
        const property_ies = depsCount === 1 ? "property" : "properties";
        return (0, codegen_1.str)`must have ${property_ies} ${deps} when property ${property} is present`;
      },
      params: ({ params: { property, depsCount, deps, missingProperty } }) => (0, codegen_1._)`{property: ${property},
    missingProperty: ${missingProperty},
    depsCount: ${depsCount},
    deps: ${deps}}`
      // TODO change to reference
    };
    var def = {
      keyword: "dependencies",
      type: "object",
      schemaType: "object",
      error: exports.error,
      code(cxt) {
        const [propDeps, schDeps] = splitDependencies(cxt);
        validatePropertyDeps(cxt, propDeps);
        validateSchemaDeps(cxt, schDeps);
      }
    };
    function splitDependencies({ schema }) {
      const propertyDeps = {};
      const schemaDeps = {};
      for (const key in schema) {
        if (key === "__proto__")
          continue;
        const deps = Array.isArray(schema[key]) ? propertyDeps : schemaDeps;
        deps[key] = schema[key];
      }
      return [propertyDeps, schemaDeps];
    }
    function validatePropertyDeps(cxt, propertyDeps = cxt.schema) {
      const { gen, data, it } = cxt;
      if (Object.keys(propertyDeps).length === 0)
        return;
      const missing = gen.let("missing");
      for (const prop in propertyDeps) {
        const deps = propertyDeps[prop];
        if (deps.length === 0)
          continue;
        const hasProperty = (0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties);
        cxt.setParams({
          property: prop,
          depsCount: deps.length,
          deps: deps.join(", ")
        });
        if (it.allErrors) {
          gen.if(hasProperty, () => {
            for (const depProp of deps) {
              (0, code_1.checkReportMissingProp)(cxt, depProp);
            }
          });
        } else {
          gen.if((0, codegen_1._)`${hasProperty} && (${(0, code_1.checkMissingProp)(cxt, deps, missing)})`);
          (0, code_1.reportMissingProp)(cxt, missing);
          gen.else();
        }
      }
    }
    exports.validatePropertyDeps = validatePropertyDeps;
    function validateSchemaDeps(cxt, schemaDeps = cxt.schema) {
      const { gen, data, keyword, it } = cxt;
      const valid = gen.name("valid");
      for (const prop in schemaDeps) {
        if ((0, util_1.alwaysValidSchema)(it, schemaDeps[prop]))
          continue;
        gen.if(
          (0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties),
          () => {
            const schCxt = cxt.subschema({ keyword, schemaProp: prop }, valid);
            cxt.mergeValidEvaluated(schCxt, valid);
          },
          () => gen.var(valid, true)
          // TODO var
        );
        cxt.ok(valid);
      }
    }
    exports.validateSchemaDeps = validateSchemaDeps;
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/propertyNames.js
var require_propertyNames = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/propertyNames.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error = {
      message: "property name must be valid",
      params: ({ params }) => (0, codegen_1._)`{propertyName: ${params.propertyName}}`
    };
    var def = {
      keyword: "propertyNames",
      type: "object",
      schemaType: ["object", "boolean"],
      error,
      code(cxt) {
        const { gen, schema, data, it } = cxt;
        if ((0, util_1.alwaysValidSchema)(it, schema))
          return;
        const valid = gen.name("valid");
        gen.forIn("key", data, (key) => {
          cxt.setParams({ propertyName: key });
          cxt.subschema({
            keyword: "propertyNames",
            data: key,
            dataTypes: ["string"],
            propertyName: key,
            compositeRule: true
          }, valid);
          gen.if((0, codegen_1.not)(valid), () => {
            cxt.error(true);
            if (!it.allErrors)
              gen.break();
          });
        });
        cxt.ok(valid);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/additionalProperties.js
var require_additionalProperties = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/additionalProperties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var util_1 = require_util();
    var error = {
      message: "must NOT have additional properties",
      params: ({ params }) => (0, codegen_1._)`{additionalProperty: ${params.additionalProperty}}`
    };
    var def = {
      keyword: "additionalProperties",
      type: ["object"],
      schemaType: ["boolean", "object"],
      allowUndefined: true,
      trackErrors: true,
      error,
      code(cxt) {
        const { gen, schema, parentSchema, data, errsCount, it } = cxt;
        if (!errsCount)
          throw new Error("ajv implementation error");
        const { allErrors, opts } = it;
        it.props = true;
        if (opts.removeAdditional !== "all" && (0, util_1.alwaysValidSchema)(it, schema))
          return;
        const props = (0, code_1.allSchemaProperties)(parentSchema.properties);
        const patProps = (0, code_1.allSchemaProperties)(parentSchema.patternProperties);
        checkAdditionalProperties();
        cxt.ok((0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
        function checkAdditionalProperties() {
          gen.forIn("key", data, (key) => {
            if (!props.length && !patProps.length)
              additionalPropertyCode(key);
            else
              gen.if(isAdditional(key), () => additionalPropertyCode(key));
          });
        }
        function isAdditional(key) {
          let definedProp;
          if (props.length > 8) {
            const propsSchema = (0, util_1.schemaRefOrVal)(it, parentSchema.properties, "properties");
            definedProp = (0, code_1.isOwnProperty)(gen, propsSchema, key);
          } else if (props.length) {
            definedProp = (0, codegen_1.or)(...props.map((p) => (0, codegen_1._)`${key} === ${p}`));
          } else {
            definedProp = codegen_1.nil;
          }
          if (patProps.length) {
            definedProp = (0, codegen_1.or)(definedProp, ...patProps.map((p) => (0, codegen_1._)`${(0, code_1.usePattern)(cxt, p)}.test(${key})`));
          }
          return (0, codegen_1.not)(definedProp);
        }
        function deleteAdditional(key) {
          gen.code((0, codegen_1._)`delete ${data}[${key}]`);
        }
        function additionalPropertyCode(key) {
          if (opts.removeAdditional === "all" || opts.removeAdditional && schema === false) {
            deleteAdditional(key);
            return;
          }
          if (schema === false) {
            cxt.setParams({ additionalProperty: key });
            cxt.error();
            if (!allErrors)
              gen.break();
            return;
          }
          if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
            const valid = gen.name("valid");
            if (opts.removeAdditional === "failing") {
              applyAdditionalSchema(key, valid, false);
              gen.if((0, codegen_1.not)(valid), () => {
                cxt.reset();
                deleteAdditional(key);
              });
            } else {
              applyAdditionalSchema(key, valid);
              if (!allErrors)
                gen.if((0, codegen_1.not)(valid), () => gen.break());
            }
          }
        }
        function applyAdditionalSchema(key, valid, errors) {
          const subschema = {
            keyword: "additionalProperties",
            dataProp: key,
            dataPropType: util_1.Type.Str
          };
          if (errors === false) {
            Object.assign(subschema, {
              compositeRule: true,
              createErrors: false,
              allErrors: false
            });
          }
          cxt.subschema(subschema, valid);
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/properties.js
var require_properties = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/properties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var validate_1 = require_validate();
    var code_1 = require_code2();
    var util_1 = require_util();
    var additionalProperties_1 = require_additionalProperties();
    var def = {
      keyword: "properties",
      type: "object",
      schemaType: "object",
      code(cxt) {
        const { gen, schema, parentSchema, data, it } = cxt;
        if (it.opts.removeAdditional === "all" && parentSchema.additionalProperties === void 0) {
          additionalProperties_1.default.code(new validate_1.KeywordCxt(it, additionalProperties_1.default, "additionalProperties"));
        }
        const allProps = (0, code_1.allSchemaProperties)(schema);
        for (const prop of allProps) {
          it.definedProperties.add(prop);
        }
        if (it.opts.unevaluated && allProps.length && it.props !== true) {
          it.props = util_1.mergeEvaluated.props(gen, (0, util_1.toHash)(allProps), it.props);
        }
        const properties = allProps.filter((p) => !(0, util_1.alwaysValidSchema)(it, schema[p]));
        if (properties.length === 0)
          return;
        const valid = gen.name("valid");
        for (const prop of properties) {
          if (hasDefault(prop)) {
            applyPropertySchema(prop);
          } else {
            gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties));
            applyPropertySchema(prop);
            if (!it.allErrors)
              gen.else().var(valid, true);
            gen.endIf();
          }
          cxt.it.definedProperties.add(prop);
          cxt.ok(valid);
        }
        function hasDefault(prop) {
          return it.opts.useDefaults && !it.compositeRule && schema[prop].default !== void 0;
        }
        function applyPropertySchema(prop) {
          cxt.subschema({
            keyword: "properties",
            schemaProp: prop,
            dataProp: prop
          }, valid);
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/patternProperties.js
var require_patternProperties = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/patternProperties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var util_2 = require_util();
    var def = {
      keyword: "patternProperties",
      type: "object",
      schemaType: "object",
      code(cxt) {
        const { gen, schema, data, parentSchema, it } = cxt;
        const { opts } = it;
        const patterns = (0, code_1.allSchemaProperties)(schema);
        const alwaysValidPatterns = patterns.filter((p) => (0, util_1.alwaysValidSchema)(it, schema[p]));
        if (patterns.length === 0 || alwaysValidPatterns.length === patterns.length && (!it.opts.unevaluated || it.props === true)) {
          return;
        }
        const checkProperties = opts.strictSchema && !opts.allowMatchingProperties && parentSchema.properties;
        const valid = gen.name("valid");
        if (it.props !== true && !(it.props instanceof codegen_1.Name)) {
          it.props = (0, util_2.evaluatedPropsToName)(gen, it.props);
        }
        const { props } = it;
        validatePatternProperties();
        function validatePatternProperties() {
          for (const pat of patterns) {
            if (checkProperties)
              checkMatchingProperties(pat);
            if (it.allErrors) {
              validateProperties(pat);
            } else {
              gen.var(valid, true);
              validateProperties(pat);
              gen.if(valid);
            }
          }
        }
        function checkMatchingProperties(pat) {
          for (const prop in checkProperties) {
            if (new RegExp(pat).test(prop)) {
              (0, util_1.checkStrictMode)(it, `property ${prop} matches pattern ${pat} (use allowMatchingProperties)`);
            }
          }
        }
        function validateProperties(pat) {
          gen.forIn("key", data, (key) => {
            gen.if((0, codegen_1._)`${(0, code_1.usePattern)(cxt, pat)}.test(${key})`, () => {
              const alwaysValid = alwaysValidPatterns.includes(pat);
              if (!alwaysValid) {
                cxt.subschema({
                  keyword: "patternProperties",
                  schemaProp: pat,
                  dataProp: key,
                  dataPropType: util_2.Type.Str
                }, valid);
              }
              if (it.opts.unevaluated && props !== true) {
                gen.assign((0, codegen_1._)`${props}[${key}]`, true);
              } else if (!alwaysValid && !it.allErrors) {
                gen.if((0, codegen_1.not)(valid), () => gen.break());
              }
            });
          });
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/not.js
var require_not = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/not.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var util_1 = require_util();
    var def = {
      keyword: "not",
      schemaType: ["object", "boolean"],
      trackErrors: true,
      code(cxt) {
        const { gen, schema, it } = cxt;
        if ((0, util_1.alwaysValidSchema)(it, schema)) {
          cxt.fail();
          return;
        }
        const valid = gen.name("valid");
        cxt.subschema({
          keyword: "not",
          compositeRule: true,
          createErrors: false,
          allErrors: false
        }, valid);
        cxt.failResult(valid, () => cxt.reset(), () => cxt.error());
      },
      error: { message: "must NOT be valid" }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/anyOf.js
var require_anyOf = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/anyOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var def = {
      keyword: "anyOf",
      schemaType: "array",
      trackErrors: true,
      code: code_1.validateUnion,
      error: { message: "must match a schema in anyOf" }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/oneOf.js
var require_oneOf = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/oneOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error = {
      message: "must match exactly one schema in oneOf",
      params: ({ params }) => (0, codegen_1._)`{passingSchemas: ${params.passing}}`
    };
    var def = {
      keyword: "oneOf",
      schemaType: "array",
      trackErrors: true,
      error,
      code(cxt) {
        const { gen, schema, parentSchema, it } = cxt;
        if (!Array.isArray(schema))
          throw new Error("ajv implementation error");
        if (it.opts.discriminator && parentSchema.discriminator)
          return;
        const schArr = schema;
        const valid = gen.let("valid", false);
        const passing = gen.let("passing", null);
        const schValid = gen.name("_valid");
        cxt.setParams({ passing });
        gen.block(validateOneOf);
        cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
        function validateOneOf() {
          schArr.forEach((sch, i) => {
            let schCxt;
            if ((0, util_1.alwaysValidSchema)(it, sch)) {
              gen.var(schValid, true);
            } else {
              schCxt = cxt.subschema({
                keyword: "oneOf",
                schemaProp: i,
                compositeRule: true
              }, schValid);
            }
            if (i > 0) {
              gen.if((0, codegen_1._)`${schValid} && ${valid}`).assign(valid, false).assign(passing, (0, codegen_1._)`[${passing}, ${i}]`).else();
            }
            gen.if(schValid, () => {
              gen.assign(valid, true);
              gen.assign(passing, i);
              if (schCxt)
                cxt.mergeEvaluated(schCxt, codegen_1.Name);
            });
          });
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/allOf.js
var require_allOf = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/allOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var util_1 = require_util();
    var def = {
      keyword: "allOf",
      schemaType: "array",
      code(cxt) {
        const { gen, schema, it } = cxt;
        if (!Array.isArray(schema))
          throw new Error("ajv implementation error");
        const valid = gen.name("valid");
        schema.forEach((sch, i) => {
          if ((0, util_1.alwaysValidSchema)(it, sch))
            return;
          const schCxt = cxt.subschema({ keyword: "allOf", schemaProp: i }, valid);
          cxt.ok(valid);
          cxt.mergeEvaluated(schCxt);
        });
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/if.js
var require_if = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/if.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error = {
      message: ({ params }) => (0, codegen_1.str)`must match "${params.ifClause}" schema`,
      params: ({ params }) => (0, codegen_1._)`{failingKeyword: ${params.ifClause}}`
    };
    var def = {
      keyword: "if",
      schemaType: ["object", "boolean"],
      trackErrors: true,
      error,
      code(cxt) {
        const { gen, parentSchema, it } = cxt;
        if (parentSchema.then === void 0 && parentSchema.else === void 0) {
          (0, util_1.checkStrictMode)(it, '"if" without "then" and "else" is ignored');
        }
        const hasThen = hasSchema(it, "then");
        const hasElse = hasSchema(it, "else");
        if (!hasThen && !hasElse)
          return;
        const valid = gen.let("valid", true);
        const schValid = gen.name("_valid");
        validateIf();
        cxt.reset();
        if (hasThen && hasElse) {
          const ifClause = gen.let("ifClause");
          cxt.setParams({ ifClause });
          gen.if(schValid, validateClause("then", ifClause), validateClause("else", ifClause));
        } else if (hasThen) {
          gen.if(schValid, validateClause("then"));
        } else {
          gen.if((0, codegen_1.not)(schValid), validateClause("else"));
        }
        cxt.pass(valid, () => cxt.error(true));
        function validateIf() {
          const schCxt = cxt.subschema({
            keyword: "if",
            compositeRule: true,
            createErrors: false,
            allErrors: false
          }, schValid);
          cxt.mergeEvaluated(schCxt);
        }
        function validateClause(keyword, ifClause) {
          return () => {
            const schCxt = cxt.subschema({ keyword }, schValid);
            gen.assign(valid, schValid);
            cxt.mergeValidEvaluated(schCxt, valid);
            if (ifClause)
              gen.assign(ifClause, (0, codegen_1._)`${keyword}`);
            else
              cxt.setParams({ ifClause: keyword });
          };
        }
      }
    };
    function hasSchema(it, keyword) {
      const schema = it.schema[keyword];
      return schema !== void 0 && !(0, util_1.alwaysValidSchema)(it, schema);
    }
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/thenElse.js
var require_thenElse = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/thenElse.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var util_1 = require_util();
    var def = {
      keyword: ["then", "else"],
      schemaType: ["object", "boolean"],
      code({ keyword, parentSchema, it }) {
        if (parentSchema.if === void 0)
          (0, util_1.checkStrictMode)(it, `"${keyword}" without "if" is ignored`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/index.js
var require_applicator = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var additionalItems_1 = require_additionalItems();
    var prefixItems_1 = require_prefixItems();
    var items_1 = require_items();
    var items2020_1 = require_items2020();
    var contains_1 = require_contains();
    var dependencies_1 = require_dependencies();
    var propertyNames_1 = require_propertyNames();
    var additionalProperties_1 = require_additionalProperties();
    var properties_1 = require_properties();
    var patternProperties_1 = require_patternProperties();
    var not_1 = require_not();
    var anyOf_1 = require_anyOf();
    var oneOf_1 = require_oneOf();
    var allOf_1 = require_allOf();
    var if_1 = require_if();
    var thenElse_1 = require_thenElse();
    function getApplicator(draft2020 = false) {
      const applicator = [
        // any
        not_1.default,
        anyOf_1.default,
        oneOf_1.default,
        allOf_1.default,
        if_1.default,
        thenElse_1.default,
        // object
        propertyNames_1.default,
        additionalProperties_1.default,
        dependencies_1.default,
        properties_1.default,
        patternProperties_1.default
      ];
      if (draft2020)
        applicator.push(prefixItems_1.default, items2020_1.default);
      else
        applicator.push(additionalItems_1.default, items_1.default);
      applicator.push(contains_1.default);
      return applicator;
    }
    exports.default = getApplicator;
  }
});

// node_modules/ajv/dist/vocabularies/dynamic/dynamicAnchor.js
var require_dynamicAnchor = __commonJS({
  "node_modules/ajv/dist/vocabularies/dynamic/dynamicAnchor.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.dynamicAnchor = void 0;
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var compile_1 = require_compile();
    var ref_1 = require_ref();
    var def = {
      keyword: "$dynamicAnchor",
      schemaType: "string",
      code: (cxt) => dynamicAnchor(cxt, cxt.schema)
    };
    function dynamicAnchor(cxt, anchor) {
      const { gen, it } = cxt;
      it.schemaEnv.root.dynamicAnchors[anchor] = true;
      const v = (0, codegen_1._)`${names_1.default.dynamicAnchors}${(0, codegen_1.getProperty)(anchor)}`;
      const validate = it.errSchemaPath === "#" ? it.validateName : _getValidate(cxt);
      gen.if((0, codegen_1._)`!${v}`, () => gen.assign(v, validate));
    }
    exports.dynamicAnchor = dynamicAnchor;
    function _getValidate(cxt) {
      const { schemaEnv, schema, self } = cxt.it;
      const { root, baseId, localRefs, meta } = schemaEnv.root;
      const { schemaId } = self.opts;
      const sch = new compile_1.SchemaEnv({ schema, schemaId, root, baseId, localRefs, meta });
      compile_1.compileSchema.call(self, sch);
      return (0, ref_1.getValidate)(cxt, sch);
    }
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/dynamic/dynamicRef.js
var require_dynamicRef = __commonJS({
  "node_modules/ajv/dist/vocabularies/dynamic/dynamicRef.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.dynamicRef = void 0;
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var ref_1 = require_ref();
    var def = {
      keyword: "$dynamicRef",
      schemaType: "string",
      code: (cxt) => dynamicRef(cxt, cxt.schema)
    };
    function dynamicRef(cxt, ref) {
      const { gen, keyword, it } = cxt;
      if (ref[0] !== "#")
        throw new Error(`"${keyword}" only supports hash fragment reference`);
      const anchor = ref.slice(1);
      if (it.allErrors) {
        _dynamicRef();
      } else {
        const valid = gen.let("valid", false);
        _dynamicRef(valid);
        cxt.ok(valid);
      }
      function _dynamicRef(valid) {
        if (it.schemaEnv.root.dynamicAnchors[anchor]) {
          const v = gen.let("_v", (0, codegen_1._)`${names_1.default.dynamicAnchors}${(0, codegen_1.getProperty)(anchor)}`);
          gen.if(v, _callRef(v, valid), _callRef(it.validateName, valid));
        } else {
          _callRef(it.validateName, valid)();
        }
      }
      function _callRef(validate, valid) {
        return valid ? () => gen.block(() => {
          (0, ref_1.callRef)(cxt, validate);
          gen.let(valid, true);
        }) : () => (0, ref_1.callRef)(cxt, validate);
      }
    }
    exports.dynamicRef = dynamicRef;
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/dynamic/recursiveAnchor.js
var require_recursiveAnchor = __commonJS({
  "node_modules/ajv/dist/vocabularies/dynamic/recursiveAnchor.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var dynamicAnchor_1 = require_dynamicAnchor();
    var util_1 = require_util();
    var def = {
      keyword: "$recursiveAnchor",
      schemaType: "boolean",
      code(cxt) {
        if (cxt.schema)
          (0, dynamicAnchor_1.dynamicAnchor)(cxt, "");
        else
          (0, util_1.checkStrictMode)(cxt.it, "$recursiveAnchor: false is ignored");
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/dynamic/recursiveRef.js
var require_recursiveRef = __commonJS({
  "node_modules/ajv/dist/vocabularies/dynamic/recursiveRef.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var dynamicRef_1 = require_dynamicRef();
    var def = {
      keyword: "$recursiveRef",
      schemaType: "string",
      code: (cxt) => (0, dynamicRef_1.dynamicRef)(cxt, cxt.schema)
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/dynamic/index.js
var require_dynamic = __commonJS({
  "node_modules/ajv/dist/vocabularies/dynamic/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var dynamicAnchor_1 = require_dynamicAnchor();
    var dynamicRef_1 = require_dynamicRef();
    var recursiveAnchor_1 = require_recursiveAnchor();
    var recursiveRef_1 = require_recursiveRef();
    var dynamic = [dynamicAnchor_1.default, dynamicRef_1.default, recursiveAnchor_1.default, recursiveRef_1.default];
    exports.default = dynamic;
  }
});

// node_modules/ajv/dist/vocabularies/validation/dependentRequired.js
var require_dependentRequired = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/dependentRequired.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var dependencies_1 = require_dependencies();
    var def = {
      keyword: "dependentRequired",
      type: "object",
      schemaType: "object",
      error: dependencies_1.error,
      code: (cxt) => (0, dependencies_1.validatePropertyDeps)(cxt)
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/dependentSchemas.js
var require_dependentSchemas = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/dependentSchemas.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var dependencies_1 = require_dependencies();
    var def = {
      keyword: "dependentSchemas",
      type: "object",
      schemaType: "object",
      code: (cxt) => (0, dependencies_1.validateSchemaDeps)(cxt)
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/limitContains.js
var require_limitContains = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/limitContains.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var util_1 = require_util();
    var def = {
      keyword: ["maxContains", "minContains"],
      type: "array",
      schemaType: "number",
      code({ keyword, parentSchema, it }) {
        if (parentSchema.contains === void 0) {
          (0, util_1.checkStrictMode)(it, `"${keyword}" without "contains" is ignored`);
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/next.js
var require_next = __commonJS({
  "node_modules/ajv/dist/vocabularies/next.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var dependentRequired_1 = require_dependentRequired();
    var dependentSchemas_1 = require_dependentSchemas();
    var limitContains_1 = require_limitContains();
    var next = [dependentRequired_1.default, dependentSchemas_1.default, limitContains_1.default];
    exports.default = next;
  }
});

// node_modules/ajv/dist/vocabularies/unevaluated/unevaluatedProperties.js
var require_unevaluatedProperties = __commonJS({
  "node_modules/ajv/dist/vocabularies/unevaluated/unevaluatedProperties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var names_1 = require_names();
    var error = {
      message: "must NOT have unevaluated properties",
      params: ({ params }) => (0, codegen_1._)`{unevaluatedProperty: ${params.unevaluatedProperty}}`
    };
    var def = {
      keyword: "unevaluatedProperties",
      type: "object",
      schemaType: ["boolean", "object"],
      trackErrors: true,
      error,
      code(cxt) {
        const { gen, schema, data, errsCount, it } = cxt;
        if (!errsCount)
          throw new Error("ajv implementation error");
        const { allErrors, props } = it;
        if (props instanceof codegen_1.Name) {
          gen.if((0, codegen_1._)`${props} !== true`, () => gen.forIn("key", data, (key) => gen.if(unevaluatedDynamic(props, key), () => unevaluatedPropCode(key))));
        } else if (props !== true) {
          gen.forIn("key", data, (key) => props === void 0 ? unevaluatedPropCode(key) : gen.if(unevaluatedStatic(props, key), () => unevaluatedPropCode(key)));
        }
        it.props = true;
        cxt.ok((0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
        function unevaluatedPropCode(key) {
          if (schema === false) {
            cxt.setParams({ unevaluatedProperty: key });
            cxt.error();
            if (!allErrors)
              gen.break();
            return;
          }
          if (!(0, util_1.alwaysValidSchema)(it, schema)) {
            const valid = gen.name("valid");
            cxt.subschema({
              keyword: "unevaluatedProperties",
              dataProp: key,
              dataPropType: util_1.Type.Str
            }, valid);
            if (!allErrors)
              gen.if((0, codegen_1.not)(valid), () => gen.break());
          }
        }
        function unevaluatedDynamic(evaluatedProps, key) {
          return (0, codegen_1._)`!${evaluatedProps} || !${evaluatedProps}[${key}]`;
        }
        function unevaluatedStatic(evaluatedProps, key) {
          const ps = [];
          for (const p in evaluatedProps) {
            if (evaluatedProps[p] === true)
              ps.push((0, codegen_1._)`${key} !== ${p}`);
          }
          return (0, codegen_1.and)(...ps);
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/unevaluated/unevaluatedItems.js
var require_unevaluatedItems = __commonJS({
  "node_modules/ajv/dist/vocabularies/unevaluated/unevaluatedItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error = {
      message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
      params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
    };
    var def = {
      keyword: "unevaluatedItems",
      type: "array",
      schemaType: ["boolean", "object"],
      error,
      code(cxt) {
        const { gen, schema, data, it } = cxt;
        const items = it.items || 0;
        if (items === true)
          return;
        const len = gen.const("len", (0, codegen_1._)`${data}.length`);
        if (schema === false) {
          cxt.setParams({ len: items });
          cxt.fail((0, codegen_1._)`${len} > ${items}`);
        } else if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
          const valid = gen.var("valid", (0, codegen_1._)`${len} <= ${items}`);
          gen.if((0, codegen_1.not)(valid), () => validateItems(valid, items));
          cxt.ok(valid);
        }
        it.items = true;
        function validateItems(valid, from) {
          gen.forRange("i", from, len, (i) => {
            cxt.subschema({ keyword: "unevaluatedItems", dataProp: i, dataPropType: util_1.Type.Num }, valid);
            if (!it.allErrors)
              gen.if((0, codegen_1.not)(valid), () => gen.break());
          });
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/unevaluated/index.js
var require_unevaluated = __commonJS({
  "node_modules/ajv/dist/vocabularies/unevaluated/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var unevaluatedProperties_1 = require_unevaluatedProperties();
    var unevaluatedItems_1 = require_unevaluatedItems();
    var unevaluated = [unevaluatedProperties_1.default, unevaluatedItems_1.default];
    exports.default = unevaluated;
  }
});

// node_modules/ajv/dist/vocabularies/format/format.js
var require_format = __commonJS({
  "node_modules/ajv/dist/vocabularies/format/format.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var error = {
      message: ({ schemaCode }) => (0, codegen_1.str)`must match format "${schemaCode}"`,
      params: ({ schemaCode }) => (0, codegen_1._)`{format: ${schemaCode}}`
    };
    var def = {
      keyword: "format",
      type: ["number", "string"],
      schemaType: "string",
      $data: true,
      error,
      code(cxt, ruleType) {
        const { gen, data, $data, schema, schemaCode, it } = cxt;
        const { opts, errSchemaPath, schemaEnv, self } = it;
        if (!opts.validateFormats)
          return;
        if ($data)
          validate$DataFormat();
        else
          validateFormat();
        function validate$DataFormat() {
          const fmts = gen.scopeValue("formats", {
            ref: self.formats,
            code: opts.code.formats
          });
          const fDef = gen.const("fDef", (0, codegen_1._)`${fmts}[${schemaCode}]`);
          const fType = gen.let("fType");
          const format = gen.let("format");
          gen.if((0, codegen_1._)`typeof ${fDef} == "object" && !(${fDef} instanceof RegExp)`, () => gen.assign(fType, (0, codegen_1._)`${fDef}.type || "string"`).assign(format, (0, codegen_1._)`${fDef}.validate`), () => gen.assign(fType, (0, codegen_1._)`"string"`).assign(format, fDef));
          cxt.fail$data((0, codegen_1.or)(unknownFmt(), invalidFmt()));
          function unknownFmt() {
            if (opts.strictSchema === false)
              return codegen_1.nil;
            return (0, codegen_1._)`${schemaCode} && !${format}`;
          }
          function invalidFmt() {
            const callFormat = schemaEnv.$async ? (0, codegen_1._)`(${fDef}.async ? await ${format}(${data}) : ${format}(${data}))` : (0, codegen_1._)`${format}(${data})`;
            const validData = (0, codegen_1._)`(typeof ${format} == "function" ? ${callFormat} : ${format}.test(${data}))`;
            return (0, codegen_1._)`${format} && ${format} !== true && ${fType} === ${ruleType} && !${validData}`;
          }
        }
        function validateFormat() {
          const formatDef = self.formats[schema];
          if (!formatDef) {
            unknownFormat();
            return;
          }
          if (formatDef === true)
            return;
          const [fmtType, format, fmtRef] = getFormat(formatDef);
          if (fmtType === ruleType)
            cxt.pass(validCondition());
          function unknownFormat() {
            if (opts.strictSchema === false) {
              self.logger.warn(unknownMsg());
              return;
            }
            throw new Error(unknownMsg());
            function unknownMsg() {
              return `unknown format "${schema}" ignored in schema at path "${errSchemaPath}"`;
            }
          }
          function getFormat(fmtDef) {
            const code = fmtDef instanceof RegExp ? (0, codegen_1.regexpCode)(fmtDef) : opts.code.formats ? (0, codegen_1._)`${opts.code.formats}${(0, codegen_1.getProperty)(schema)}` : void 0;
            const fmt = gen.scopeValue("formats", { key: schema, ref: fmtDef, code });
            if (typeof fmtDef == "object" && !(fmtDef instanceof RegExp)) {
              return [fmtDef.type || "string", fmtDef.validate, (0, codegen_1._)`${fmt}.validate`];
            }
            return ["string", fmtDef, fmt];
          }
          function validCondition() {
            if (typeof formatDef == "object" && !(formatDef instanceof RegExp) && formatDef.async) {
              if (!schemaEnv.$async)
                throw new Error("async format in sync schema");
              return (0, codegen_1._)`await ${fmtRef}(${data})`;
            }
            return typeof format == "function" ? (0, codegen_1._)`${fmtRef}(${data})` : (0, codegen_1._)`${fmtRef}.test(${data})`;
          }
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/format/index.js
var require_format2 = __commonJS({
  "node_modules/ajv/dist/vocabularies/format/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var format_1 = require_format();
    var format = [format_1.default];
    exports.default = format;
  }
});

// node_modules/ajv/dist/vocabularies/metadata.js
var require_metadata = __commonJS({
  "node_modules/ajv/dist/vocabularies/metadata.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.contentVocabulary = exports.metadataVocabulary = void 0;
    exports.metadataVocabulary = [
      "title",
      "description",
      "default",
      "deprecated",
      "readOnly",
      "writeOnly",
      "examples"
    ];
    exports.contentVocabulary = [
      "contentMediaType",
      "contentEncoding",
      "contentSchema"
    ];
  }
});

// node_modules/ajv/dist/vocabularies/draft2020.js
var require_draft2020 = __commonJS({
  "node_modules/ajv/dist/vocabularies/draft2020.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var core_1 = require_core2();
    var validation_1 = require_validation();
    var applicator_1 = require_applicator();
    var dynamic_1 = require_dynamic();
    var next_1 = require_next();
    var unevaluated_1 = require_unevaluated();
    var format_1 = require_format2();
    var metadata_1 = require_metadata();
    var draft2020Vocabularies = [
      dynamic_1.default,
      core_1.default,
      validation_1.default,
      (0, applicator_1.default)(true),
      format_1.default,
      metadata_1.metadataVocabulary,
      metadata_1.contentVocabulary,
      next_1.default,
      unevaluated_1.default
    ];
    exports.default = draft2020Vocabularies;
  }
});

// node_modules/ajv/dist/vocabularies/discriminator/types.js
var require_types = __commonJS({
  "node_modules/ajv/dist/vocabularies/discriminator/types.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiscrError = void 0;
    var DiscrError;
    (function(DiscrError2) {
      DiscrError2["Tag"] = "tag";
      DiscrError2["Mapping"] = "mapping";
    })(DiscrError || (exports.DiscrError = DiscrError = {}));
  }
});

// node_modules/ajv/dist/vocabularies/discriminator/index.js
var require_discriminator = __commonJS({
  "node_modules/ajv/dist/vocabularies/discriminator/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var types_1 = require_types();
    var compile_1 = require_compile();
    var ref_error_1 = require_ref_error();
    var util_1 = require_util();
    var error = {
      message: ({ params: { discrError, tagName } }) => discrError === types_1.DiscrError.Tag ? `tag "${tagName}" must be string` : `value of tag "${tagName}" must be in oneOf`,
      params: ({ params: { discrError, tag, tagName } }) => (0, codegen_1._)`{error: ${discrError}, tag: ${tagName}, tagValue: ${tag}}`
    };
    var def = {
      keyword: "discriminator",
      type: "object",
      schemaType: "object",
      error,
      code(cxt) {
        const { gen, data, schema, parentSchema, it } = cxt;
        const { oneOf } = parentSchema;
        if (!it.opts.discriminator) {
          throw new Error("discriminator: requires discriminator option");
        }
        const tagName = schema.propertyName;
        if (typeof tagName != "string")
          throw new Error("discriminator: requires propertyName");
        if (schema.mapping)
          throw new Error("discriminator: mapping is not supported");
        if (!oneOf)
          throw new Error("discriminator: requires oneOf keyword");
        const valid = gen.let("valid", false);
        const tag = gen.const("tag", (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(tagName)}`);
        gen.if((0, codegen_1._)`typeof ${tag} == "string"`, () => validateMapping(), () => cxt.error(false, { discrError: types_1.DiscrError.Tag, tag, tagName }));
        cxt.ok(valid);
        function validateMapping() {
          const mapping = getMapping();
          gen.if(false);
          for (const tagValue in mapping) {
            gen.elseIf((0, codegen_1._)`${tag} === ${tagValue}`);
            gen.assign(valid, applyTagSchema(mapping[tagValue]));
          }
          gen.else();
          cxt.error(false, { discrError: types_1.DiscrError.Mapping, tag, tagName });
          gen.endIf();
        }
        function applyTagSchema(schemaProp) {
          const _valid = gen.name("valid");
          const schCxt = cxt.subschema({ keyword: "oneOf", schemaProp }, _valid);
          cxt.mergeEvaluated(schCxt, codegen_1.Name);
          return _valid;
        }
        function getMapping() {
          var _a;
          const oneOfMapping = {};
          const topRequired = hasRequired(parentSchema);
          let tagRequired = true;
          for (let i = 0; i < oneOf.length; i++) {
            let sch = oneOf[i];
            if ((sch === null || sch === void 0 ? void 0 : sch.$ref) && !(0, util_1.schemaHasRulesButRef)(sch, it.self.RULES)) {
              const ref = sch.$ref;
              sch = compile_1.resolveRef.call(it.self, it.schemaEnv.root, it.baseId, ref);
              if (sch instanceof compile_1.SchemaEnv)
                sch = sch.schema;
              if (sch === void 0)
                throw new ref_error_1.default(it.opts.uriResolver, it.baseId, ref);
            }
            const propSch = (_a = sch === null || sch === void 0 ? void 0 : sch.properties) === null || _a === void 0 ? void 0 : _a[tagName];
            if (typeof propSch != "object") {
              throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${tagName}"`);
            }
            tagRequired = tagRequired && (topRequired || hasRequired(sch));
            addMappings(propSch, i);
          }
          if (!tagRequired)
            throw new Error(`discriminator: "${tagName}" must be required`);
          return oneOfMapping;
          function hasRequired({ required }) {
            return Array.isArray(required) && required.includes(tagName);
          }
          function addMappings(sch, i) {
            if (sch.const) {
              addMapping(sch.const, i);
            } else if (sch.enum) {
              for (const tagValue of sch.enum) {
                addMapping(tagValue, i);
              }
            } else {
              throw new Error(`discriminator: "properties/${tagName}" must have "const" or "enum"`);
            }
          }
          function addMapping(tagValue, i) {
            if (typeof tagValue != "string" || tagValue in oneOfMapping) {
              throw new Error(`discriminator: "${tagName}" values must be unique strings`);
            }
            oneOfMapping[tagValue] = i;
          }
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/refs/json-schema-2020-12/schema.json
var require_schema4 = __commonJS({
  "node_modules/ajv/dist/refs/json-schema-2020-12/schema.json"(exports, module) {
    module.exports = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://json-schema.org/draft/2020-12/schema",
      $vocabulary: {
        "https://json-schema.org/draft/2020-12/vocab/core": true,
        "https://json-schema.org/draft/2020-12/vocab/applicator": true,
        "https://json-schema.org/draft/2020-12/vocab/unevaluated": true,
        "https://json-schema.org/draft/2020-12/vocab/validation": true,
        "https://json-schema.org/draft/2020-12/vocab/meta-data": true,
        "https://json-schema.org/draft/2020-12/vocab/format-annotation": true,
        "https://json-schema.org/draft/2020-12/vocab/content": true
      },
      $dynamicAnchor: "meta",
      title: "Core and Validation specifications meta-schema",
      allOf: [
        { $ref: "meta/core" },
        { $ref: "meta/applicator" },
        { $ref: "meta/unevaluated" },
        { $ref: "meta/validation" },
        { $ref: "meta/meta-data" },
        { $ref: "meta/format-annotation" },
        { $ref: "meta/content" }
      ],
      type: ["object", "boolean"],
      $comment: "This meta-schema also defines keywords that have appeared in previous drafts in order to prevent incompatible extensions as they remain in common use.",
      properties: {
        definitions: {
          $comment: '"definitions" has been replaced by "$defs".',
          type: "object",
          additionalProperties: { $dynamicRef: "#meta" },
          deprecated: true,
          default: {}
        },
        dependencies: {
          $comment: '"dependencies" has been split and replaced by "dependentSchemas" and "dependentRequired" in order to serve their differing semantics.',
          type: "object",
          additionalProperties: {
            anyOf: [{ $dynamicRef: "#meta" }, { $ref: "meta/validation#/$defs/stringArray" }]
          },
          deprecated: true,
          default: {}
        },
        $recursiveAnchor: {
          $comment: '"$recursiveAnchor" has been replaced by "$dynamicAnchor".',
          $ref: "meta/core#/$defs/anchorString",
          deprecated: true
        },
        $recursiveRef: {
          $comment: '"$recursiveRef" has been replaced by "$dynamicRef".',
          $ref: "meta/core#/$defs/uriReferenceString",
          deprecated: true
        }
      }
    };
  }
});

// node_modules/ajv/dist/refs/json-schema-2020-12/meta/applicator.json
var require_applicator2 = __commonJS({
  "node_modules/ajv/dist/refs/json-schema-2020-12/meta/applicator.json"(exports, module) {
    module.exports = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://json-schema.org/draft/2020-12/meta/applicator",
      $vocabulary: {
        "https://json-schema.org/draft/2020-12/vocab/applicator": true
      },
      $dynamicAnchor: "meta",
      title: "Applicator vocabulary meta-schema",
      type: ["object", "boolean"],
      properties: {
        prefixItems: { $ref: "#/$defs/schemaArray" },
        items: { $dynamicRef: "#meta" },
        contains: { $dynamicRef: "#meta" },
        additionalProperties: { $dynamicRef: "#meta" },
        properties: {
          type: "object",
          additionalProperties: { $dynamicRef: "#meta" },
          default: {}
        },
        patternProperties: {
          type: "object",
          additionalProperties: { $dynamicRef: "#meta" },
          propertyNames: { format: "regex" },
          default: {}
        },
        dependentSchemas: {
          type: "object",
          additionalProperties: { $dynamicRef: "#meta" },
          default: {}
        },
        propertyNames: { $dynamicRef: "#meta" },
        if: { $dynamicRef: "#meta" },
        then: { $dynamicRef: "#meta" },
        else: { $dynamicRef: "#meta" },
        allOf: { $ref: "#/$defs/schemaArray" },
        anyOf: { $ref: "#/$defs/schemaArray" },
        oneOf: { $ref: "#/$defs/schemaArray" },
        not: { $dynamicRef: "#meta" }
      },
      $defs: {
        schemaArray: {
          type: "array",
          minItems: 1,
          items: { $dynamicRef: "#meta" }
        }
      }
    };
  }
});

// node_modules/ajv/dist/refs/json-schema-2020-12/meta/unevaluated.json
var require_unevaluated2 = __commonJS({
  "node_modules/ajv/dist/refs/json-schema-2020-12/meta/unevaluated.json"(exports, module) {
    module.exports = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://json-schema.org/draft/2020-12/meta/unevaluated",
      $vocabulary: {
        "https://json-schema.org/draft/2020-12/vocab/unevaluated": true
      },
      $dynamicAnchor: "meta",
      title: "Unevaluated applicator vocabulary meta-schema",
      type: ["object", "boolean"],
      properties: {
        unevaluatedItems: { $dynamicRef: "#meta" },
        unevaluatedProperties: { $dynamicRef: "#meta" }
      }
    };
  }
});

// node_modules/ajv/dist/refs/json-schema-2020-12/meta/content.json
var require_content = __commonJS({
  "node_modules/ajv/dist/refs/json-schema-2020-12/meta/content.json"(exports, module) {
    module.exports = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://json-schema.org/draft/2020-12/meta/content",
      $vocabulary: {
        "https://json-schema.org/draft/2020-12/vocab/content": true
      },
      $dynamicAnchor: "meta",
      title: "Content vocabulary meta-schema",
      type: ["object", "boolean"],
      properties: {
        contentEncoding: { type: "string" },
        contentMediaType: { type: "string" },
        contentSchema: { $dynamicRef: "#meta" }
      }
    };
  }
});

// node_modules/ajv/dist/refs/json-schema-2020-12/meta/core.json
var require_core3 = __commonJS({
  "node_modules/ajv/dist/refs/json-schema-2020-12/meta/core.json"(exports, module) {
    module.exports = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://json-schema.org/draft/2020-12/meta/core",
      $vocabulary: {
        "https://json-schema.org/draft/2020-12/vocab/core": true
      },
      $dynamicAnchor: "meta",
      title: "Core vocabulary meta-schema",
      type: ["object", "boolean"],
      properties: {
        $id: {
          $ref: "#/$defs/uriReferenceString",
          $comment: "Non-empty fragments not allowed.",
          pattern: "^[^#]*#?$"
        },
        $schema: { $ref: "#/$defs/uriString" },
        $ref: { $ref: "#/$defs/uriReferenceString" },
        $anchor: { $ref: "#/$defs/anchorString" },
        $dynamicRef: { $ref: "#/$defs/uriReferenceString" },
        $dynamicAnchor: { $ref: "#/$defs/anchorString" },
        $vocabulary: {
          type: "object",
          propertyNames: { $ref: "#/$defs/uriString" },
          additionalProperties: {
            type: "boolean"
          }
        },
        $comment: {
          type: "string"
        },
        $defs: {
          type: "object",
          additionalProperties: { $dynamicRef: "#meta" }
        }
      },
      $defs: {
        anchorString: {
          type: "string",
          pattern: "^[A-Za-z_][-A-Za-z0-9._]*$"
        },
        uriString: {
          type: "string",
          format: "uri"
        },
        uriReferenceString: {
          type: "string",
          format: "uri-reference"
        }
      }
    };
  }
});

// node_modules/ajv/dist/refs/json-schema-2020-12/meta/format-annotation.json
var require_format_annotation = __commonJS({
  "node_modules/ajv/dist/refs/json-schema-2020-12/meta/format-annotation.json"(exports, module) {
    module.exports = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://json-schema.org/draft/2020-12/meta/format-annotation",
      $vocabulary: {
        "https://json-schema.org/draft/2020-12/vocab/format-annotation": true
      },
      $dynamicAnchor: "meta",
      title: "Format vocabulary meta-schema for annotation results",
      type: ["object", "boolean"],
      properties: {
        format: { type: "string" }
      }
    };
  }
});

// node_modules/ajv/dist/refs/json-schema-2020-12/meta/meta-data.json
var require_meta_data = __commonJS({
  "node_modules/ajv/dist/refs/json-schema-2020-12/meta/meta-data.json"(exports, module) {
    module.exports = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://json-schema.org/draft/2020-12/meta/meta-data",
      $vocabulary: {
        "https://json-schema.org/draft/2020-12/vocab/meta-data": true
      },
      $dynamicAnchor: "meta",
      title: "Meta-data vocabulary meta-schema",
      type: ["object", "boolean"],
      properties: {
        title: {
          type: "string"
        },
        description: {
          type: "string"
        },
        default: true,
        deprecated: {
          type: "boolean",
          default: false
        },
        readOnly: {
          type: "boolean",
          default: false
        },
        writeOnly: {
          type: "boolean",
          default: false
        },
        examples: {
          type: "array",
          items: true
        }
      }
    };
  }
});

// node_modules/ajv/dist/refs/json-schema-2020-12/meta/validation.json
var require_validation2 = __commonJS({
  "node_modules/ajv/dist/refs/json-schema-2020-12/meta/validation.json"(exports, module) {
    module.exports = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://json-schema.org/draft/2020-12/meta/validation",
      $vocabulary: {
        "https://json-schema.org/draft/2020-12/vocab/validation": true
      },
      $dynamicAnchor: "meta",
      title: "Validation vocabulary meta-schema",
      type: ["object", "boolean"],
      properties: {
        type: {
          anyOf: [
            { $ref: "#/$defs/simpleTypes" },
            {
              type: "array",
              items: { $ref: "#/$defs/simpleTypes" },
              minItems: 1,
              uniqueItems: true
            }
          ]
        },
        const: true,
        enum: {
          type: "array",
          items: true
        },
        multipleOf: {
          type: "number",
          exclusiveMinimum: 0
        },
        maximum: {
          type: "number"
        },
        exclusiveMaximum: {
          type: "number"
        },
        minimum: {
          type: "number"
        },
        exclusiveMinimum: {
          type: "number"
        },
        maxLength: { $ref: "#/$defs/nonNegativeInteger" },
        minLength: { $ref: "#/$defs/nonNegativeIntegerDefault0" },
        pattern: {
          type: "string",
          format: "regex"
        },
        maxItems: { $ref: "#/$defs/nonNegativeInteger" },
        minItems: { $ref: "#/$defs/nonNegativeIntegerDefault0" },
        uniqueItems: {
          type: "boolean",
          default: false
        },
        maxContains: { $ref: "#/$defs/nonNegativeInteger" },
        minContains: {
          $ref: "#/$defs/nonNegativeInteger",
          default: 1
        },
        maxProperties: { $ref: "#/$defs/nonNegativeInteger" },
        minProperties: { $ref: "#/$defs/nonNegativeIntegerDefault0" },
        required: { $ref: "#/$defs/stringArray" },
        dependentRequired: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/stringArray"
          }
        }
      },
      $defs: {
        nonNegativeInteger: {
          type: "integer",
          minimum: 0
        },
        nonNegativeIntegerDefault0: {
          $ref: "#/$defs/nonNegativeInteger",
          default: 0
        },
        simpleTypes: {
          enum: ["array", "boolean", "integer", "null", "number", "object", "string"]
        },
        stringArray: {
          type: "array",
          items: { type: "string" },
          uniqueItems: true,
          default: []
        }
      }
    };
  }
});

// node_modules/ajv/dist/refs/json-schema-2020-12/index.js
var require_json_schema_2020_12 = __commonJS({
  "node_modules/ajv/dist/refs/json-schema-2020-12/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var metaSchema = require_schema4();
    var applicator = require_applicator2();
    var unevaluated = require_unevaluated2();
    var content = require_content();
    var core = require_core3();
    var format = require_format_annotation();
    var metadata = require_meta_data();
    var validation = require_validation2();
    var META_SUPPORT_DATA = ["/properties"];
    function addMetaSchema2020($data) {
      ;
      [
        metaSchema,
        applicator,
        unevaluated,
        content,
        core,
        with$data(this, format),
        metadata,
        with$data(this, validation)
      ].forEach((sch) => this.addMetaSchema(sch, void 0, false));
      return this;
      function with$data(ajv2, sch) {
        return $data ? ajv2.$dataMetaSchema(sch, META_SUPPORT_DATA) : sch;
      }
    }
    exports.default = addMetaSchema2020;
  }
});

// node_modules/ajv/dist/2020.js
var require__ = __commonJS({
  "node_modules/ajv/dist/2020.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MissingRefError = exports.ValidationError = exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = exports.Ajv2020 = void 0;
    var core_1 = require_core();
    var draft2020_1 = require_draft2020();
    var discriminator_1 = require_discriminator();
    var json_schema_2020_12_1 = require_json_schema_2020_12();
    var META_SCHEMA_ID = "https://json-schema.org/draft/2020-12/schema";
    var Ajv20202 = class extends core_1.default {
      constructor(opts = {}) {
        super({
          ...opts,
          dynamicRef: true,
          next: true,
          unevaluated: true
        });
      }
      _addVocabularies() {
        super._addVocabularies();
        draft2020_1.default.forEach((v) => this.addVocabulary(v));
        if (this.opts.discriminator)
          this.addKeyword(discriminator_1.default);
      }
      _addDefaultMetaSchema() {
        super._addDefaultMetaSchema();
        const { $data, meta } = this.opts;
        if (!meta)
          return;
        json_schema_2020_12_1.default.call(this, $data);
        this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
      }
      defaultMeta() {
        return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : void 0);
      }
    };
    exports.Ajv2020 = Ajv20202;
    module.exports = exports = Ajv20202;
    module.exports.Ajv2020 = Ajv20202;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Ajv20202;
    var validate_1 = require_validate();
    Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function() {
      return validate_1.KeywordCxt;
    } });
    var codegen_1 = require_codegen();
    Object.defineProperty(exports, "_", { enumerable: true, get: function() {
      return codegen_1._;
    } });
    Object.defineProperty(exports, "str", { enumerable: true, get: function() {
      return codegen_1.str;
    } });
    Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
      return codegen_1.stringify;
    } });
    Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
      return codegen_1.nil;
    } });
    Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
      return codegen_1.Name;
    } });
    Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function() {
      return codegen_1.CodeGen;
    } });
    var validation_error_1 = require_validation_error();
    Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function() {
      return validation_error_1.default;
    } });
    var ref_error_1 = require_ref_error();
    Object.defineProperty(exports, "MissingRefError", { enumerable: true, get: function() {
      return ref_error_1.default;
    } });
  }
});

// scripts/schema-lib.mjs
import { readFile } from "node:fs/promises";
async function loadJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}
async function validateWithSchema(schemaPath, value) {
  const cacheKey = typeof schemaPath === "string" ? schemaPath : schemaPath.$id ?? schemaPath;
  let validate = validators.get(cacheKey);
  if (!validate) {
    const schema = typeof schemaPath === "string" ? await loadJson(schemaPath) : schemaPath;
    validate = ajv.compile(schema);
    validators.set(cacheKey, validate);
  }
  const valid = validate(value);
  return {
    valid,
    errors: valid ? [] : validate.errors.map(formatAjvError)
  };
}
function formatAjvError(error) {
  const location = error.instancePath || "/";
  if (error.keyword === "required") {
    return `${location} must contain ${error.params.missingProperty}`;
  }
  if (error.keyword === "additionalProperties") {
    return `${location} contains unsupported field ${error.params.additionalProperty}`;
  }
  return `${location} ${error.message}`;
}
var import__, ajv, validators;
var init_schema_lib = __esm({
  "scripts/schema-lib.mjs"() {
    import__ = __toESM(require__(), 1);
    ajv = new import__.default({ allErrors: true, strict: true });
    validators = /* @__PURE__ */ new Map();
  }
});

// scripts/schemas.generated.mjs
var schemas, skillSchemasByProfile;
var init_schemas_generated = __esm({
  "scripts/schemas.generated.mjs"() {
    schemas = Object.freeze({
      "claude-code.frontmatter": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://skillsforge.local/schemas/claude-code.frontmatter.schema.json",
        "title": "Agent Skills frontmatter with Claude Code extensions",
        "type": "object",
        "additionalProperties": false,
        "required": [
          "name",
          "description"
        ],
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1,
            "maxLength": 64,
            "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
          },
          "description": {
            "type": "string",
            "minLength": 1,
            "maxLength": 1024
          },
          "license": {
            "type": "string",
            "minLength": 1
          },
          "compatibility": {
            "type": "string",
            "minLength": 1,
            "maxLength": 500
          },
          "metadata": {
            "type": "object",
            "additionalProperties": {
              "type": "string"
            }
          },
          "allowed-tools": {
            "$ref": "#/$defs/toolList"
          },
          "disallowed-tools": {
            "$ref": "#/$defs/toolList"
          },
          "when_to_use": {
            "type": "string",
            "minLength": 1
          },
          "argument-hint": {
            "type": "string"
          },
          "arguments": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "array",
                "items": {
                  "type": "string"
                }
              }
            ]
          },
          "disable-model-invocation": {
            "type": "boolean"
          },
          "user-invocable": {
            "type": "boolean"
          },
          "model": {
            "type": "string",
            "minLength": 1
          },
          "context": {
            "const": "fork"
          },
          "agent": {
            "type": "string",
            "minLength": 1
          },
          "hooks": {
            "type": "object"
          }
        },
        "$defs": {
          "toolList": {
            "anyOf": [
              {
                "type": "string",
                "minLength": 1
              },
              {
                "type": "array",
                "minItems": 1,
                "items": {
                  "type": "string",
                  "minLength": 1
                }
              }
            ]
          }
        }
      },
      "codex-package": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://skillsforge.local/schemas/codex-package.schema.json",
        "title": "SkillsForge Codex package receipt",
        "type": "object",
        "additionalProperties": false,
        "required": [
          "ok",
          "host",
          "skill",
          "outDir",
          "dryRun",
          "files",
          "interop"
        ],
        "properties": {
          "ok": {
            "type": "boolean"
          },
          "host": {
            "type": "string",
            "const": "codex"
          },
          "skill": {
            "type": "string",
            "minLength": 1
          },
          "outDir": {
            "type": "string",
            "minLength": 1
          },
          "dryRun": {
            "type": "boolean"
          },
          "force": {
            "type": "boolean"
          },
          "files": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "path"
              ],
              "properties": {
                "path": {
                  "type": "string",
                  "minLength": 1
                },
                "action": {
                  "type": "string",
                  "enum": [
                    "copy",
                    "generate",
                    "write"
                  ]
                }
              }
            }
          },
          "interop": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "accepted",
              "transformed",
              "ignored",
              "runtimeEnforced",
              "usesSidecar"
            ],
            "properties": {
              "accepted": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "transformed": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "ignored": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "runtimeEnforced": {
                "type": "boolean"
              },
              "usesSidecar": {
                "type": "boolean"
              },
              "losses": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              }
            }
          },
          "findings": {
            "type": "array",
            "items": {
              "type": "object"
            }
          },
          "errors": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "notes": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "plugin": {
            "type": "object",
            "additionalProperties": true
          }
        }
      },
      "forge-spec": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://skillsforge.local/schemas/forge-spec.schema.json",
        "title": "SkillsForge forge specification",
        "type": "object",
        "additionalProperties": false,
        "required": [
          "name",
          "description",
          "overview",
          "routing",
          "capabilities"
        ],
        "properties": {
          "name": {
            "type": "string",
            "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
          },
          "description": {
            "type": "string",
            "minLength": 1,
            "maxLength": 1024
          },
          "overview": {
            "type": "string",
            "minLength": 1
          },
          "whenToUse": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1
            }
          },
          "maturity": {
            "type": "string",
            "enum": [
              "experimental",
              "stable",
              "deprecated"
            ]
          },
          "requires": {
            "type": "array",
            "items": {
              "type": "string",
              "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
            }
          },
          "routing": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "triggers"
            ],
            "properties": {
              "triggers": {
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1
                },
                "minItems": 1
              },
              "antiTriggers": {
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1
                }
              },
              "mode": {
                "type": "string",
                "enum": [
                  "auto",
                  "explicit"
                ]
              },
              "pack": {
                "type": "string",
                "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                "minLength": 1
              }
            }
          },
          "capabilities": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "exec",
              "network",
              "write"
            ],
            "properties": {
              "exec": {
                "type": "object",
                "additionalProperties": false,
                "required": [
                  "allowed"
                ],
                "properties": {
                  "allowed": {
                    "type": "boolean"
                  },
                  "commands": {
                    "type": "array",
                    "items": {
                      "type": "string",
                      "minLength": 1
                    }
                  }
                }
              },
              "network": {
                "type": "object",
                "additionalProperties": false,
                "required": [
                  "allowed"
                ],
                "properties": {
                  "allowed": {
                    "type": "boolean"
                  },
                  "searchAllowed": {
                    "type": "boolean"
                  },
                  "hosts": {
                    "type": "array",
                    "items": {
                      "type": "string",
                      "minLength": 1
                    }
                  }
                }
              },
              "write": {
                "type": "object",
                "additionalProperties": false,
                "required": [
                  "scope"
                ],
                "properties": {
                  "scope": {
                    "type": "string",
                    "enum": [
                      "skill",
                      "project",
                      "none"
                    ]
                  }
                }
              }
            }
          },
          "compatibility": {
            "type": "object",
            "additionalProperties": {
              "enum": [
                "full",
                "partial",
                "unsupported"
              ]
            }
          },
          "provenance": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "source": {
                "type": "string"
              },
              "license": {
                "type": "string"
              }
            }
          }
        }
      },
      "marketplace": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://skillsforge.local/schemas/marketplace.schema.json",
        "title": "Claude Code plugin marketplace",
        "type": "object",
        "additionalProperties": false,
        "required": [
          "name",
          "owner",
          "plugins"
        ],
        "properties": {
          "name": {
            "type": "string",
            "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
          },
          "description": {
            "type": "string",
            "minLength": 1
          },
          "owner": {
            "$ref": "#/$defs/person"
          },
          "metadata": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "pluginRoot"
            ],
            "properties": {
              "pluginRoot": {
                "type": "string",
                "pattern": "^\\./.+"
              }
            }
          },
          "plugins": {
            "type": "array",
            "minItems": 1,
            "items": {
              "$ref": "#/$defs/plugin"
            }
          }
        },
        "$defs": {
          "person": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "name"
            ],
            "properties": {
              "name": {
                "type": "string",
                "minLength": 1
              },
              "email": {
                "type": "string",
                "minLength": 1
              },
              "url": {
                "type": "string",
                "minLength": 1
              }
            }
          },
          "plugin": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "name",
              "source"
            ],
            "properties": {
              "name": {
                "type": "string",
                "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
              },
              "source": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^(\\.|\\./.+)$"
                  },
                  {
                    "type": "object"
                  }
                ]
              },
              "category": {
                "type": "string",
                "minLength": 1
              },
              "tags": {
                "type": "array",
                "uniqueItems": true,
                "items": {
                  "type": "string",
                  "minLength": 1
                }
              },
              "description": {
                "type": "string",
                "minLength": 1
              },
              "version": {
                "type": "string",
                "pattern": "^\\d+\\.\\d+\\.\\d+$"
              },
              "author": {
                "$ref": "#/$defs/person"
              },
              "homepage": {
                "type": "string",
                "minLength": 1
              },
              "repository": {
                "type": "string",
                "minLength": 1
              },
              "license": {
                "type": "string",
                "minLength": 1
              },
              "keywords": {
                "type": "array",
                "uniqueItems": true,
                "items": {
                  "type": "string",
                  "minLength": 1
                }
              },
              "strict": {
                "type": "boolean"
              }
            }
          }
        }
      },
      "plugin": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://skillsforge.local/schemas/plugin.schema.json",
        "title": "SkillsForge plugin manifest",
        "type": "object",
        "additionalProperties": false,
        "required": [
          "name",
          "version",
          "description",
          "author",
          "repository",
          "license",
          "keywords"
        ],
        "properties": {
          "name": {
            "type": "string",
            "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
          },
          "version": {
            "type": "string",
            "pattern": "^\\d+\\.\\d+\\.\\d+$"
          },
          "description": {
            "type": "string",
            "maxLength": 500
          },
          "author": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "name"
            ],
            "properties": {
              "name": {
                "type": "string",
                "minLength": 1
              },
              "email": {
                "type": "string",
                "minLength": 1
              },
              "url": {
                "type": "string",
                "minLength": 1
              }
            }
          },
          "homepage": {
            "type": "string",
            "minLength": 1
          },
          "repository": {
            "type": "string",
            "minLength": 1
          },
          "license": {
            "type": "string"
          },
          "keywords": {
            "type": "array",
            "minItems": 1,
            "uniqueItems": true,
            "items": {
              "type": "string",
              "minLength": 1
            }
          }
        }
      },
      "skill.frontmatter": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://skillsforge.local/schemas/skill.frontmatter.schema.json",
        "title": "SkillsForge skill frontmatter",
        "type": "object",
        "additionalProperties": false,
        "required": [
          "name",
          "description"
        ],
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1,
            "maxLength": 64,
            "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
          },
          "description": {
            "type": "string",
            "minLength": 1,
            "maxLength": 1024
          },
          "license": {
            "type": "string",
            "minLength": 1
          },
          "compatibility": {
            "type": "string",
            "minLength": 1,
            "maxLength": 500
          },
          "metadata": {
            "type": "object",
            "additionalProperties": {
              "type": "string"
            }
          },
          "allowed-tools": {
            "type": "string",
            "minLength": 1
          }
        }
      },
      "skillsforge.catalog": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://skillsforge.local/schemas/skillsforge.catalog.schema.json",
        "title": "SkillsForge catalog",
        "type": "object",
        "additionalProperties": false,
        "required": [
          "schemaVersion",
          "packs",
          "profiles"
        ],
        "properties": {
          "schemaVersion": {
            "type": "integer",
            "const": 1
          },
          "packs": {
            "type": "object",
            "additionalProperties": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "description",
                "skills"
              ],
              "properties": {
                "description": {
                  "type": "string",
                  "minLength": 1
                },
                "skills": {
                  "type": "array",
                  "items": {
                    "type": "string",
                    "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
                  },
                  "uniqueItems": true,
                  "minItems": 1
                }
              }
            }
          },
          "profiles": {
            "type": "object",
            "additionalProperties": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "description",
                "packs"
              ],
              "properties": {
                "description": {
                  "type": "string",
                  "minLength": 1
                },
                "packs": {
                  "type": "array",
                  "items": {
                    "type": "string",
                    "minLength": 1
                  },
                  "uniqueItems": true,
                  "minItems": 1
                }
              }
            }
          }
        }
      },
      "skillsforge.sidecar": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://skillsforge.local/schemas/skillsforge.sidecar.schema.json",
        "title": "SkillsForge capability sidecar",
        "type": "object",
        "additionalProperties": false,
        "required": [
          "schemaVersion",
          "routing",
          "capabilities"
        ],
        "properties": {
          "schemaVersion": {
            "type": "integer",
            "const": 1
          },
          "maturity": {
            "type": "string",
            "enum": [
              "experimental",
              "stable",
              "deprecated"
            ]
          },
          "requires": {
            "type": "array",
            "items": {
              "type": "string",
              "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
            },
            "uniqueItems": true
          },
          "routing": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "triggers",
              "antiTriggers"
            ],
            "properties": {
              "triggers": {
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1
                },
                "minItems": 1,
                "uniqueItems": true
              },
              "antiTriggers": {
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1
                },
                "uniqueItems": true
              },
              "mode": {
                "type": "string",
                "enum": [
                  "auto",
                  "explicit"
                ],
                "default": "explicit"
              },
              "pack": {
                "type": "string",
                "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                "minLength": 1
              }
            }
          },
          "capabilities": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "exec",
              "network",
              "write"
            ],
            "properties": {
              "exec": {
                "type": "object",
                "additionalProperties": false,
                "required": [
                  "allowed",
                  "commands"
                ],
                "properties": {
                  "allowed": {
                    "type": "boolean"
                  },
                  "commands": {
                    "type": "array",
                    "items": {
                      "type": "string",
                      "minLength": 1
                    },
                    "uniqueItems": true
                  }
                }
              },
              "network": {
                "type": "object",
                "additionalProperties": false,
                "required": [
                  "allowed",
                  "hosts"
                ],
                "properties": {
                  "allowed": {
                    "type": "boolean"
                  },
                  "searchAllowed": {
                    "type": "boolean"
                  },
                  "hosts": {
                    "type": "array",
                    "items": {
                      "type": "string",
                      "minLength": 1,
                      "pattern": "^[A-Za-z0-9.-]+(?::\\d+)?$"
                    },
                    "uniqueItems": true
                  }
                }
              },
              "write": {
                "type": "object",
                "additionalProperties": false,
                "required": [
                  "scope"
                ],
                "properties": {
                  "scope": {
                    "type": "string",
                    "enum": [
                      "skill",
                      "project",
                      "none"
                    ]
                  }
                }
              },
              "mcp": {
                "type": "object",
                "additionalProperties": false,
                "properties": {
                  "allowed": {
                    "type": "boolean"
                  },
                  "tools": {
                    "type": "array",
                    "items": {
                      "type": "string",
                      "minLength": 1
                    },
                    "uniqueItems": true
                  }
                }
              }
            }
          },
          "compatibility": {
            "type": "object",
            "additionalProperties": {
              "type": "string",
              "enum": [
                "full",
                "partial",
                "unsupported"
              ]
            }
          },
          "provenance": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "source": {
                "type": "string",
                "minLength": 1
              },
              "license": {
                "type": "string",
                "minLength": 1
              }
            }
          }
        }
      }
    });
    skillSchemasByProfile = Object.freeze({
      canonical: schemas["skill.frontmatter"],
      "claude-code": schemas["claude-code.frontmatter"]
    });
  }
});

// scripts/validate-skill-lib.mjs
import { access, readFile as readFile2, readdir, realpath, stat } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
async function validateSkillPaths(paths, options = {}) {
  const root = options.root ?? process.cwd();
  const profile = options.profile ?? "canonical";
  const selected = options.all ? await discoverRealSkills(root) : await expandSkillPathPatterns(paths, root);
  if (selected.length === 0) {
    const ok = options.allowEmpty === true;
    return {
      ok,
      reports: [],
      text: ok ? "No skills found.\n" : "FAIL No skills found.\n"
    };
  }
  const reports = [];
  for (const path of selected) reports.push(await validateSkillPath(path, { root, profile }));
  const text = `${reports.map(formatReport).join("\n")}
`;
  return { ok: reports.every((report) => report.status === "pass"), reports, text };
}
async function validateSkillPath(skillPath, options = {}) {
  const root = options.root ?? process.cwd();
  const profile = options.profile ?? "canonical";
  const schema = skillSchemasByProfile[profile];
  if (!schema) throw new Error(`Unknown validation profile: ${profile}`);
  const absolute = resolve(root, skillPath);
  const name = basename(absolute);
  const file = join(absolute, "SKILL.md");
  const errors = [];
  let source;
  try {
    source = await readFile2(file, "utf8");
  } catch {
    return failReport(name, absolute, ["SKILL.md must exist"]);
  }
  const parsed = parseFrontmatter(source);
  if (!parsed) return failReport(name, absolute, ["YAML frontmatter block must exist and use complete --- delimiter lines"]);
  const document = (0, import_yaml.parseDocument)(parsed.yaml, {
    prettyErrors: true,
    strict: true,
    uniqueKeys: true
  });
  if (document.errors.length > 0) {
    errors.push(...document.errors.map((error) => `invalid YAML: ${firstLine(error.message)}`));
  }
  let data;
  if (document.errors.length === 0) {
    data = document.toJS();
    if (!isPlainObject(data)) {
      errors.push("frontmatter must be a YAML mapping");
    } else {
      const schemaResult = await validateWithSchema(schema, data);
      errors.push(...schemaResult.errors.map((error) => `frontmatter ${error}`));
      if (typeof data.name === "string" && data.name !== name) errors.push("name must equal directory name");
    }
  }
  await validateBody(parsed.body, absolute, errors);
  await validateSidecar(absolute, errors);
  return errors.length === 0 ? { name, path: absolute, profile, status: "pass", errors: [] } : failReport(name, absolute, errors, profile);
}
function parseFrontmatter(source) {
  const normalized = source.startsWith("\uFEFF") ? source.slice(1) : source;
  const match = normalized.match(/^---[\t ]*\r?\n([\s\S]*?)\r?\n---[\t ]*(?:\r?\n|$)/);
  if (!match) return null;
  return {
    yaml: match[1],
    body: normalized.slice(match[0].length)
  };
}
async function validateSidecar(skillDirectory, errors) {
  const path = join(skillDirectory, "skillsforge.json");
  if (!await fileExists(path)) return;
  let sidecar;
  try {
    sidecar = JSON.parse(await readFile2(path, "utf8"));
  } catch (error) {
    errors.push(`skillsforge.json must be valid JSON: ${firstLine(error.message)}`);
    return;
  }
  const schemaResult = await validateWithSchema(sidecarSchema, sidecar);
  errors.push(...schemaResult.errors.map((error) => `skillsforge.json ${error}`));
  if (!isPlainObject(sidecar?.capabilities)) return;
  const { exec, network } = sidecar.capabilities;
  if (exec?.allowed === false && Array.isArray(exec.commands) && exec.commands.length > 0) {
    errors.push("skillsforge.json /capabilities/exec/commands must be empty when allowed is false");
  }
  if (network?.allowed === false && Array.isArray(network.hosts) && network.hosts.length > 0) {
    errors.push("skillsforge.json /capabilities/network/hosts must be empty when allowed is false");
  }
}
async function validateBody(body, skillDirectory, errors) {
  if (body.trim() === "") errors.push("body must contain skill instructions");
  const links = body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g);
  for (const [, rawTarget] of links) {
    const target = normalizeMarkdownTarget(rawTarget);
    if (target === "" || target.startsWith("#") || /^(https?|mailto):/i.test(target)) continue;
    if (/^[a-z][a-z0-9+.-]*:/i.test(target)) {
      errors.push(`markdown link uses unsupported URI scheme: ${rawTarget}`);
      continue;
    }
    const clean = target.split("#")[0];
    if (clean === "") continue;
    const resolved = resolve(skillDirectory, clean);
    if (!isInside(skillDirectory, resolved)) {
      errors.push(`relative markdown link must stay inside skill directory: ${rawTarget}`);
      continue;
    }
    if (!await fileExists(resolved)) {
      errors.push(`relative markdown link must resolve: ${rawTarget}`);
      continue;
    }
    if (!await realPathIsInside(skillDirectory, resolved)) {
      errors.push(`relative markdown link resolves outside skill directory: ${rawTarget}`);
    }
  }
}
function normalizeMarkdownTarget(rawTarget) {
  const withoutTitle = rawTarget.trim().replace(/^<|>$/g, "").split(/\s+["']/)[0];
  try {
    return decodeURIComponent(withoutTitle);
  } catch {
    return withoutTitle;
  }
}
function isInside(parent, candidate) {
  const path = relative(resolve(parent), resolve(candidate));
  return path === "" || !path.startsWith(`..${sep}`) && path !== ".." && !isAbsolute(path);
}
async function realPathIsInside(parent, candidate) {
  try {
    return isInside(await realpath(parent), await realpath(candidate));
  } catch {
    return false;
  }
}
function formatReport(report) {
  if (report.status === "pass") return `PASS ${report.name} (${report.profile})`;
  return [`FAIL ${report.name}`, ...report.errors.map((error) => `  - ${error}`)].join("\n");
}
async function expandSkillPathPatterns(patterns, root) {
  const expanded = [];
  for (const pattern of pathsWithoutDuplicates(patterns)) {
    if (!pattern.includes("*")) {
      expanded.push(pattern);
      continue;
    }
    const normalized = pattern.replaceAll("\\", "/");
    const slash = normalized.lastIndexOf("/");
    const parent = slash === -1 ? "." : normalized.slice(0, slash);
    const namePattern = slash === -1 ? normalized : normalized.slice(slash + 1);
    const regex = new RegExp(`^${namePattern.split("*").map(escapeRegex).join(".*")}$`);
    let entries;
    try {
      entries = await readdir(resolve(root, parent), { withFileTypes: true });
    } catch {
      expanded.push(pattern);
      continue;
    }
    const matches = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || !regex.test(entry.name)) continue;
      const candidate = join(parent, entry.name);
      if (await fileExists(resolve(root, candidate, "SKILL.md"))) matches.push(candidate);
    }
    matches.sort((left, right) => left.localeCompare(right));
    expanded.push(...matches.length === 0 ? [pattern] : matches);
  }
  return expanded;
}
async function discoverRealSkills(root) {
  const skillsRoots = [join(root, "skills"), adjacentSkillsRoot];
  const pluginsRoot = join(root, "plugins");
  try {
    const plugins = await readdir(pluginsRoot, { withFileTypes: true });
    for (const plugin of plugins) {
      if (plugin.isDirectory()) skillsRoots.push(join(pluginsRoot, plugin.name, "skills"));
    }
  } catch {
  }
  const paths = [];
  for (const skillsRoot of pathsWithoutDuplicates(skillsRoots)) {
    paths.push(...await discoverSkillsInDirectory(skillsRoot));
  }
  return pathsWithoutDuplicates(paths);
}
async function discoverSkillsInDirectory(skillsRoot) {
  try {
    const entries = await readdir(skillsRoot, { withFileTypes: true });
    const paths = [];
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      if (!entry.isDirectory()) continue;
      const candidate = join(skillsRoot, entry.name);
      try {
        await access(join(candidate, "SKILL.md"));
        paths.push(candidate);
      } catch {
      }
    }
    return paths;
  } catch {
    return [];
  }
}
function failReport(name, path, errors, profile = "canonical") {
  return { name, path, profile, status: "fail", errors };
}
function fileExists(path) {
  return stat(path).then(() => true, () => false);
}
function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}
function firstLine(value) {
  return value.split("\n")[0];
}
function isPlainObject(value) {
  return value !== null && !Array.isArray(value) && typeof value === "object";
}
function pathsWithoutDuplicates(paths) {
  return [...new Set(paths)];
}
var import_yaml, adjacentSkillsRoot, sidecarSchema;
var init_validate_skill_lib = __esm({
  "scripts/validate-skill-lib.mjs"() {
    import_yaml = __toESM(require_dist(), 1);
    init_schema_lib();
    init_schemas_generated();
    adjacentSkillsRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "skills");
    sidecarSchema = schemas["skillsforge.sidecar"];
  }
});

// lib/capabilities/skill-loader.mjs
import { access as access2, readFile as readFile3, readdir as readdir2, realpath as realpath2, stat as stat2 } from "node:fs/promises";
import { basename as basename2, dirname as dirname2, isAbsolute as isAbsolute2, join as join2, relative as relative2, resolve as resolve2, sep as sep2 } from "node:path";
async function loadSkill(dir, options = {}) {
  const abs = resolve2(options.root ?? process.cwd(), dir);
  const skillFile = join2(abs, "SKILL.md");
  const source = await readFile3(skillFile, "utf8");
  const parsed = parseFrontmatter(source);
  if (!parsed) throw new Error(`SKILL.md frontmatter missing in ${abs}`);
  const document = (0, import_yaml2.parseDocument)(parsed.yaml, { prettyErrors: true, strict: true, uniqueKeys: true });
  if (document.errors.length > 0) {
    throw new Error(document.errors.map((error) => error.message).join("; "));
  }
  const front = document.toJS() ?? {};
  const sidecarFile = join2(abs, "skillsforge.json");
  let sidecar = null;
  let sidecarExists = false;
  try {
    await access2(sidecarFile);
    sidecarExists = true;
    sidecar = JSON.parse(await readFile3(sidecarFile, "utf8"));
    const result = await validateWithSchema(sidecarSchema2, sidecar);
    if (!result.valid) {
      throw new Error(result.errors.map((error) => `skillsforge.json ${error}`).join("; "));
    }
  } catch (error) {
    if (sidecarExists) throw error;
  }
  const files = await collectFiles(abs);
  for (const file of files) {
    if (!await realPathIsInside2(abs, file)) {
      throw new Error(`skill file escapes skill root: ${relative2(abs, file)}`);
    }
  }
  return {
    name: typeof front.name === "string" ? front.name : basename2(abs),
    description: typeof front.description === "string" ? front.description : "",
    body: parsed.body,
    directory: abs,
    skillFile,
    sidecarFile: sidecarExists ? sidecarFile : null,
    sidecar,
    requires: Array.isArray(sidecar?.requires) ? sidecar.requires : [],
    maturity: sidecar?.maturity ?? "experimental",
    files
  };
}
async function skillsRootsFingerprint(skillsRoots) {
  const parts = [];
  for (const skillsRoot of skillsRoots) {
    try {
      const st = await stat2(skillsRoot);
      parts.push(`${skillsRoot}:${st.mtimeMs}`);
      const entries = await readdir2(skillsRoot, { withFileTypes: true });
      parts.push(String(entries.filter((e) => e.isDirectory()).length));
    } catch {
      parts.push(`${skillsRoot}:missing`);
    }
  }
  return parts.join("|");
}
async function loadAllSkills(root, options = {}) {
  const absRoot = resolve2(root);
  const skillsRoots = await discoverSkillsRoots(absRoot);
  const fingerprint = await skillsRootsFingerprint(skillsRoots);
  const cacheKey = absRoot;
  if (!options.noCache) {
    const hit = skillIndexCache.get(cacheKey);
    if (hit && hit.fingerprint === fingerprint) {
      return hit.skills;
    }
  }
  const skills = [];
  const errors = [];
  for (const skillsRoot of skillsRoots) {
    let entries = [];
    try {
      entries = await readdir2(skillsRoot, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory()) continue;
      const candidate = join2(skillsRoot, entry.name);
      try {
        await access2(join2(candidate, "SKILL.md"));
      } catch {
        continue;
      }
      try {
        skills.push(await loadSkill(candidate));
      } catch (error) {
        errors.push({ directory: candidate, message: error.message });
      }
    }
  }
  if (errors.length > 0) {
    const details = errors.map((error) => `${error.directory}: ${error.message}`).join("\n");
    throw new Error(`failed to load skills:
${details}`);
  }
  skillIndexCache.set(cacheKey, { fingerprint, skills });
  return skills;
}
async function discoverSkillsRoots(root) {
  const roots = [join2(root, "skills")];
  const pluginsRoot = join2(root, "plugins");
  try {
    const plugins = await readdir2(pluginsRoot, { withFileTypes: true });
    for (const plugin of plugins.sort((a, b) => a.name.localeCompare(b.name))) {
      if (plugin.isDirectory()) roots.push(join2(pluginsRoot, plugin.name, "skills"));
    }
  } catch {
  }
  return roots;
}
async function collectFiles(dir) {
  const out = [];
  for (const entry of await readdir2(dir, { withFileTypes: true })) {
    const path = join2(dir, entry.name);
    if (entry.isDirectory()) out.push(...await collectFiles(path));
    else out.push(path);
  }
  return out.sort((left, right) => left.localeCompare(right));
}
function isInside2(parent, candidate) {
  const path = relative2(resolve2(parent), resolve2(candidate));
  return path === "" || !path.startsWith(`..${sep2}`) && path !== ".." && !isAbsolute2(path);
}
async function realPathIsInside2(parent, candidate) {
  try {
    return isInside2(await realpath2(parent), await realpath2(candidate));
  } catch {
    return false;
  }
}
var import_yaml2, sidecarSchema2, skillIndexCache;
var init_skill_loader = __esm({
  "lib/capabilities/skill-loader.mjs"() {
    init_validate_skill_lib();
    import_yaml2 = __toESM(require_dist(), 1);
    init_schema_lib();
    init_schemas_generated();
    sidecarSchema2 = schemas["skillsforge.sidecar"];
    skillIndexCache = /* @__PURE__ */ new Map();
  }
});

// lib/capabilities/router.mjs
function scoreSkill(query, skill) {
  const queryTokens = tokenize(query);
  const reasons = [];
  let score = 0;
  let triggerScore = 0;
  for (const trigger of skill.sidecar?.routing?.triggers ?? []) {
    const hits = phraseHits(queryTokens, trigger);
    if (hits > 0) {
      const delta = 2 * hits;
      score += delta;
      triggerScore += delta;
      reasons.push(`trigger "${trigger}" +${delta}`);
    }
  }
  for (const anti of skill.sidecar?.routing?.antiTriggers ?? []) {
    const hits = phraseHits(queryTokens, anti);
    if (hits > 0) {
      const delta = 4 * hits;
      score -= delta;
      reasons.push(`antiTrigger "${anti}" -${delta}`);
    }
  }
  const descriptionOverlap = tokenize(skill.description).filter((token) => token.length > 3 && queryTokens.includes(token)).length;
  if (descriptionOverlap > 0) {
    score += descriptionOverlap;
    reasons.push(`description overlap +${descriptionOverlap}`);
  }
  if (skill.maturity === "deprecated") {
    score -= 5;
    reasons.push("deprecated -5");
  }
  return { name: skill.name, score, triggerScore, reasons };
}
function routeQuery(query, skills, options = {}) {
  const threshold = options.threshold ?? THRESHOLD;
  const margin = options.margin ?? MARGIN;
  const pack = options.pack ?? null;
  const includeExplicit = options.includeExplicit === true;
  const scoped = skills.filter((skill) => {
    const mode = skill.sidecar?.routing?.mode ?? "auto";
    const skillPack = skill.sidecar?.routing?.pack ?? null;
    if (pack && skillPack !== pack) return false;
    if (!includeExplicit && !pack && mode === "explicit") return false;
    return true;
  });
  const candidates = scoped.map((skill) => scoreSkill(query, skill)).sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));
  const top = candidates[0];
  const second = candidates[1];
  let selected = null;
  let fallback = null;
  if (!top || top.score < threshold) {
    fallback = "no-skill-above-threshold";
  } else if (top.triggerScore <= 0) {
    fallback = "no-trigger-evidence";
  } else if (second && top.score - second.score < margin) {
    fallback = "insufficient-margin";
  } else {
    selected = top.name;
  }
  return {
    query,
    selected,
    threshold,
    margin,
    fallback: selected ? null : fallback,
    candidates
  };
}
var tokenize, phraseHits, THRESHOLD, MARGIN;
var init_router = __esm({
  "lib/capabilities/router.mjs"() {
    tokenize = (text) => text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
    phraseHits = (queryTokens, phrase) => {
      const phraseTokens = tokenize(phrase);
      if (phraseTokens.length === 0) return 0;
      for (let index = 0; index <= queryTokens.length - phraseTokens.length; index += 1) {
        let matched = true;
        for (let offset = 0; offset < phraseTokens.length; offset += 1) {
          if (queryTokens[index + offset] !== phraseTokens[offset]) {
            matched = false;
            break;
          }
        }
        if (matched) return phraseTokens.length;
      }
      return 0;
    };
    THRESHOLD = 2;
    MARGIN = 1;
  }
});

// lib/capabilities/policy.mjs
import { readFile as readFile4, readdir as readdir3, realpath as realpath3, lstat } from "node:fs/promises";
import { extname, isAbsolute as isAbsolute3, join as join3, relative as relative3, resolve as resolve3, sep as sep3 } from "node:path";
async function scanSkill(skill) {
  const findings = [];
  const caps = skill.sidecar?.capabilities ?? {
    exec: { allowed: false, commands: [] },
    network: { allowed: false, hosts: [] },
    write: { scope: "skill" }
  };
  const files = skill.files ?? await collectFiles2(skill.directory);
  const unscanned = [];
  for (const file of files) {
    const relativePath = relative3(skill.directory, file).replaceAll("\\", "/");
    let stats2;
    try {
      stats2 = await lstat(file);
    } catch {
      continue;
    }
    if (stats2.isSymbolicLink()) {
      try {
        const real = await realpath3(file);
        const realDir = await realpath3(skill.directory);
        if (!isInside3(realDir, real)) {
          findings.push(finding(
            "symlink-escape",
            true,
            [relativePath],
            "remove symlink or keep target inside skill root",
            { writeScope: caps.write?.scope ?? "skill" },
            { symlinkTarget: real }
          ));
        }
      } catch {
        findings.push(finding(
          "symlink-escape",
          true,
          [relativePath],
          "remove broken symlink",
          { writeScope: caps.write?.scope ?? "skill" },
          { symlinkTarget: "unresolved" }
        ));
      }
    }
    const extension = extname(file).toLowerCase();
    if (EXEC_EXTENSIONS.has(extension) && caps.exec?.allowed !== true) {
      findings.push(finding(
        "undeclared-exec-file",
        true,
        [relativePath],
        "declare capabilities.exec.allowed: true or remove the script",
        { exec: false },
        { executableFile: relativePath }
      ));
    }
    const raw = await readFile4(file);
    const looksText = TEXT_EXTENSIONS.has(extension) || isProbablyText(raw);
    if (!looksText) {
      if (stats2.size > 0) unscanned.push(relativePath);
      continue;
    }
    if (raw.byteLength > MAX_TEXT_BYTES) {
      findings.push(finding(
        "oversized-unscanned-file",
        true,
        [relativePath],
        "reduce file size or declare capability and split content",
        { maxTextBytes: MAX_TEXT_BYTES },
        { sizeBytes: raw.byteLength }
      ));
      continue;
    }
    const text = raw.toString("utf8");
    const { body, lineOffset } = extension === ".md" ? markdownScanRegion(text) : { body: text, lineOffset: 0 };
    if (caps.exec?.allowed !== true) {
      for (const line of matchingLines(body, EXEC_CONTENT)) {
        const absoluteLine = line + lineOffset;
        findings.push(finding(
          "undeclared-exec-content",
          true,
          [`${relativePath}:${absoluteLine}`],
          "declare capabilities.exec.allowed: true or remove process execution",
          { exec: false },
          { processExecutionReference: true, line: absoluteLine }
        ));
      }
    }
    if (caps.network?.allowed !== true) {
      for (const line of matchingLines(body, NETWORK_CONTENT)) {
        const absoluteLine = line + lineOffset;
        findings.push(finding(
          "undeclared-network",
          true,
          [`${relativePath}:${absoluteLine}`],
          "declare capabilities.network.allowed: true or remove network references",
          { network: false },
          { networkReference: true, line: absoluteLine }
        ));
      }
    }
    if (caps.network?.allowed === true) {
      const allowedHosts = caps.network.hosts ?? [];
      for (const match of body.matchAll(HOST_PATTERN)) {
        const host = normalizeHost(match[1]);
        if (!host) continue;
        if (!hostAllowed(host, allowedHosts)) {
          const line = lineNumberAt(body, match.index ?? 0) + lineOffset;
          findings.push(finding(
            "undeclared-host",
            true,
            [`${relativePath}:${line}:${host}`],
            `add ${host} to capabilities.network.hosts or remove it`,
            { hosts: [...allowedHosts].sort() },
            { host, line }
          ));
        }
      }
    }
    if (caps.write?.scope === "skill" || caps.write?.scope === "none") {
      for (const match of body.matchAll(PATH_ESCAPE)) {
        const candidate = match[1];
        if (candidate.includes("..") || isAbsolute3(candidate)) {
          const line = lineNumberAt(body, match.index ?? 0) + lineOffset;
          findings.push(finding(
            "write-scope-escape",
            true,
            [`${relativePath}:${line}:${candidate}`],
            "keep writes inside declared write.scope",
            { writeScope: caps.write?.scope ?? "skill" },
            { path: candidate, line }
          ));
        }
      }
    }
  }
  if (unscanned.length > 0) {
    findings.push(finding(
      "unverified-binary",
      false,
      unscanned,
      "binary/non-text files were not content-scanned",
      { contentScan: true },
      { unscannedFiles: unscanned.length }
    ));
  }
  return dedupeFindings(findings);
}
function finding(rule, blocking, evidence, fix, declared = null, detected = null) {
  return {
    rule,
    blocking,
    blocked: blocking,
    unverified: !blocking,
    evidence,
    fix,
    declared,
    detected
  };
}
function dedupeFindings(findings) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const item of findings) {
    const key = `${item.rule}|${item.evidence.join(",")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
async function collectFiles2(dir) {
  const out = [];
  for (const entry of await readdir3(dir, { withFileTypes: true })) {
    const path = join3(dir, entry.name);
    if (entry.isDirectory()) out.push(...await collectFiles2(path));
    else out.push(path);
  }
  return out;
}
function isInside3(parent, candidate) {
  const path = relative3(resolve3(parent), resolve3(candidate));
  return path === "" || !path.startsWith(`..${sep3}`) && path !== ".." && !isAbsolute3(path);
}
function isProbablyText(buffer) {
  if (buffer.byteLength === 0) return false;
  if (buffer.includes(0)) return false;
  const sample = buffer.subarray(0, Math.min(buffer.byteLength, 512));
  let printable = 0;
  for (const byte of sample) {
    if (byte === 9 || byte === 10 || byte === 13 || byte >= 32 && byte < 127) printable += 1;
  }
  if (printable / sample.byteLength < 0.85) return false;
  return !/[\uFFFD]/.test(sample.toString("utf8"));
}
function markdownScanRegion(text) {
  const match = text.match(/^---[\t ]*\r?\n[\s\S]*?\r?\n---[\t ]*(?:\r?\n|$)/);
  if (!match) return { body: text, lineOffset: 0 };
  const frontmatterLines = match[0].split(/\r?\n/).length - 1;
  return { body: text.slice(match[0].length), lineOffset: frontmatterLines };
}
function matchingLines(text, pattern) {
  const lines = [];
  const parts = text.split(/\r?\n/);
  for (let index = 0; index < parts.length; index += 1) {
    if (pattern.test(parts[index])) lines.push(index + 1);
    pattern.lastIndex = 0;
  }
  return lines;
}
function lineNumberAt(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i += 1) {
    if (text[i] === "\n") line += 1;
  }
  return line;
}
function normalizeHost(value) {
  return String(value ?? "").toLowerCase().replace(/[),.;]+$/g, "").trim();
}
function hostAllowed(host, declaredHosts = []) {
  const normalized = host.toLowerCase();
  return declaredHosts.some((declared) => {
    const allowed = String(declared).toLowerCase();
    return normalized === allowed || allowed.startsWith("*.") && normalized.endsWith(allowed.slice(1));
  });
}
var EXEC_EXTENSIONS, TEXT_EXTENSIONS, EXEC_CONTENT, NETWORK_CONTENT, HOST_PATTERN, PATH_ESCAPE, MAX_TEXT_BYTES, POLICY_RULES;
var init_policy = __esm({
  "lib/capabilities/policy.mjs"() {
    EXEC_EXTENSIONS = /* @__PURE__ */ new Set([".sh", ".ps1", ".cmd", ".bat", ".exe", ".py", ".mjs", ".js", ".cjs"]);
    TEXT_EXTENSIONS = /* @__PURE__ */ new Set([
      ".md",
      ".json",
      ".txt",
      ".yml",
      ".yaml",
      ".sh",
      ".ps1",
      ".cmd",
      ".bat",
      ".py",
      ".mjs",
      ".js",
      ".cjs",
      ".ts",
      ".tsx",
      ".html",
      ".css",
      ".toml",
      ".ini"
    ]);
    EXEC_CONTENT = /\b(?:child_process|exec(?:File|Sync)\b|exec\s*\(|\.exec\b|spawn(?:Sync)?\s*\(|spawn(?:Sync)?\b)/;
    NETWORK_CONTENT = /\b(?:fetch\s*\(|axios\b|curl\b|wget\b|WebFetch|WebSearch|https?:\/\/|wss?:\/\/)/i;
    HOST_PATTERN = /\b(?:https?|wss?):\/\/([^/\s"'`]+)/gi;
    PATH_ESCAPE = /(?:^|[\s"'`=(])((?:\.\.\/)+[^\s"'`)]+|\/(?:etc|tmp|var|home|Users)\/[^\s"'`)]+|[A-Za-z]:\\[^\s"'`)]+)/g;
    MAX_TEXT_BYTES = 256e3;
    POLICY_RULES = Object.freeze([
      "undeclared-exec-file",
      "undeclared-exec-content",
      "undeclared-network",
      "undeclared-host",
      "write-scope-escape",
      "symlink-escape",
      "oversized-unscanned-file",
      "unverified-binary"
    ]);
  }
});

// lib/capabilities/dependency-graph.mjs
function analyzeDependencies(skills) {
  const byName = /* @__PURE__ */ new Map();
  const duplicates = [];
  for (const skill of skills) {
    if (byName.has(skill.name)) duplicates.push(skill.name);
    else byName.set(skill.name, skill);
  }
  const missing = [];
  for (const skill of byName.values()) {
    for (const dep of skill.requires ?? []) {
      if (!byName.has(dep)) missing.push({ skill: skill.name, requires: dep });
    }
  }
  const cycles = [];
  const order = [];
  const state = /* @__PURE__ */ new Map();
  const visit = (name, path) => {
    if (state.get(name) === "done") return;
    if (state.get(name) === "active") {
      cycles.push([...path.slice(path.indexOf(name)), name]);
      return;
    }
    state.set(name, "active");
    for (const dep of byName.get(name)?.requires ?? []) {
      if (byName.has(dep)) visit(dep, [...path, name]);
    }
    state.set(name, "done");
    order.push(name);
  };
  for (const name of byName.keys()) visit(name, []);
  return {
    cycles,
    missing,
    duplicates,
    order: cycles.length === 0 ? order : []
  };
}
var init_dependency_graph = __esm({
  "lib/capabilities/dependency-graph.mjs"() {
  }
});

// lib/capabilities/receipt.mjs
import { createHash } from "node:crypto";
import { readdir as readdir4, readFile as readFile5 } from "node:fs/promises";
import { join as join5, relative as relative4, resolve as resolve5 } from "node:path";
function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
function toPosixRelative(from, file) {
  return relative4(from, file).replaceAll("\\", "/");
}
function comparePosixPath(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}
function normalizeEvaluation(evaluation, options = {}) {
  if (!evaluation || typeof evaluation !== "object") return null;
  const corpusSha256 = evaluation.corpusSha256 ?? null;
  if (!corpusSha256) return null;
  const reportSha256 = options.reportSha256 ?? evaluation.reportSha256 ?? (options.reportBytes ? sha256(options.reportBytes) : null);
  return {
    corpusSha256,
    reportSha256: reportSha256 ?? null,
    total: Number(evaluation.total) || 0,
    tp: Number(evaluation.tp) || 0,
    fp: Number(evaluation.fp) || 0,
    fn: Number(evaluation.fn) || 0,
    tn: Number(evaluation.tn) || 0
  };
}
async function hashSkillFiles(skill) {
  const fileHashes = [];
  for (const file of skill.files ?? []) {
    const content = await readFile5(file);
    fileHashes.push({
      path: toPosixRelative(skill.directory, file),
      sha256: sha256(content)
    });
  }
  fileHashes.sort((a, b) => comparePosixPath(a.path, b.path));
  const unitHash = sha256(fileHashes.map((item) => `${item.path}:${item.sha256}`).join("\n"));
  return { files: fileHashes, unitHash };
}
async function collectFilesRecursive(dir) {
  const out = [];
  for (const entry of await readdir4(dir, { withFileTypes: true })) {
    const path = join5(dir, entry.name);
    if (entry.isDirectory()) out.push(...await collectFilesRecursive(path));
    else if (entry.isFile()) out.push(path);
  }
  return out;
}
async function hashPackageTree(packageRoot) {
  const root = resolve5(packageRoot);
  const files = await collectFilesRecursive(root);
  const fileHashes = [];
  for (const file of files) {
    const content = await readFile5(file);
    fileHashes.push({
      path: toPosixRelative(root, file),
      sha256: sha256(content)
    });
  }
  fileHashes.sort((a, b) => comparePosixPath(a.path, b.path));
  const packageHash = sha256(fileHashes.map((item) => `${item.path}:${item.sha256}`).join("\n"));
  return { files: fileHashes, packageHash };
}
async function buildReceipt(skills, options = {}) {
  const graph = analyzeDependencies(skills);
  if (graph.cycles.length || graph.missing.length || graph.duplicates.length) {
    return {
      ok: false,
      errors: [
        ...graph.cycles.map((cycle) => `dependency-cycle ${cycle.join(" -> ")}`),
        ...graph.missing.map((item) => `missing-dependency ${item.skill} -> ${item.requires}`),
        ...graph.duplicates.map((name) => `duplicate-name ${name}`)
      ]
    };
  }
  const units = [];
  const blocked = [];
  const unverified = [];
  for (const skill of skills) {
    const findings = await scanSkill(skill);
    const blocking = findings.filter((item) => item.blocking);
    if (blocking.length > 0) blocked.push(...blocking.map((item) => ({ skill: skill.name, ...item })));
    for (const item of findings.filter((finding2) => !finding2.blocking)) {
      unverified.push({
        skill: skill.name,
        rule: item.rule,
        evidence: item.evidence,
        limitation: item.limitation
      });
    }
    const { files: fileHashes, unitHash } = await hashSkillFiles(skill);
    units.push({
      name: skill.name,
      unitHash,
      files: fileHashes,
      capabilities: skill.sidecar?.capabilities ?? null,
      requires: skill.requires ?? [],
      findings: findings.map((item) => ({
        rule: item.rule,
        blocking: item.blocking,
        unverified: Boolean(item.unverified),
        evidence: item.evidence
      }))
    });
  }
  if (blocked.length > 0) {
    return { ok: false, errors: blocked.map((item) => `${item.skill}:${item.rule}`), blocked };
  }
  const evaluation = normalizeEvaluation(options.evaluation, {
    reportSha256: options.reportSha256,
    reportBytes: options.reportBytes
  });
  if (options.requireEvaluation && (!evaluation || !evaluation.reportSha256)) {
    return { ok: false, errors: ["missing holdout evaluation corpusSha256 + reportSha256 + confusion counts"] };
  }
  let packageInfo = null;
  if (options.packageRoot) {
    packageInfo = await hashPackageTree(options.packageRoot);
  }
  const receipt = {
    version: options.version ?? RECEIPT_VERSION,
    skills: units.sort((a, b) => comparePosixPath(a.name, b.name)),
    dependencyOrder: graph.order,
    package: packageInfo,
    evaluation,
    lossiness: options.lossiness ?? null,
    hostValidation: options.hostValidation ?? null,
    scanner: {
      version: SCANNER_VERSION,
      rules: [...POLICY_RULES]
    },
    unverified
  };
  assertNoTimestamps(receipt);
  const text = `${JSON.stringify(receipt, null, 2)}
`;
  return { ok: true, receipt, receiptHash: sha256(text), text };
}
async function verifyReceipt(receiptPath, skills, options = {}) {
  const expectedText = await readFile5(receiptPath, "utf8");
  const expected = JSON.parse(expectedText);
  const actualReceiptHash = sha256(expectedText);
  const packageOnly = Boolean(options.packageOnly);
  const requireEvaluation = options.requireEvaluation ?? !packageOnly;
  const mismatches = [];
  const unverified = [];
  if (options.expectedReceiptHash && actualReceiptHash !== options.expectedReceiptHash) {
    mismatches.push("receipt hash mismatch");
  }
  const packageRoot = options.packageRoot ?? null;
  const rebuilt = await buildReceipt(skills, {
    version: expected.version,
    evaluation: expected.evaluation,
    lossiness: Object.hasOwn(options, "lossiness") ? options.lossiness : expected.lossiness,
    hostValidation: Object.hasOwn(options, "hostValidation") ? options.hostValidation : expected.hostValidation,
    packageRoot,
    requireEvaluation: false
  });
  if (!rebuilt.ok) return { ok: false, errors: rebuilt.errors, mismatches: [], unverified: [] };
  for (const unit of expected.skills ?? []) {
    const actual = rebuilt.receipt.skills.find((item) => item.name === unit.name);
    if (!actual) mismatches.push(`missing skill ${unit.name}`);
    else {
      if (actual.unitHash !== unit.unitHash) mismatches.push(`unit hash mismatch ${unit.name}`);
      if (stableJson(pickSkillMetadata(actual)) !== stableJson(pickSkillMetadata(unit))) {
        mismatches.push(`skill metadata mismatch ${unit.name}`);
      }
    }
  }
  for (const unit of rebuilt.receipt.skills) {
    if (!(expected.skills ?? []).some((item) => item.name === unit.name)) {
      mismatches.push(`unexpected skill ${unit.name}`);
    }
  }
  if (expected.package?.packageHash) {
    if (!packageRoot) {
      mismatches.push("missing package root for package hash verification");
    } else if (rebuilt.receipt.package?.packageHash !== expected.package.packageHash) {
      mismatches.push("package hash mismatch");
    } else if (stableJson(rebuilt.receipt.package) !== stableJson(expected.package)) {
      mismatches.push("package metadata mismatch");
    }
  }
  compareDeterministicField(mismatches, "dependencyOrder", rebuilt.receipt.dependencyOrder, expected.dependencyOrder);
  compareDeterministicField(mismatches, "scanner", rebuilt.receipt.scanner, expected.scanner);
  compareDeterministicField(mismatches, "unverified", rebuilt.receipt.unverified, expected.unverified);
  if (Object.hasOwn(options, "lossiness")) {
    compareDeterministicField(mismatches, "lossiness", rebuilt.receipt.lossiness, expected.lossiness);
  }
  if (Object.hasOwn(options, "hostValidation")) {
    compareDeterministicField(mismatches, "hostValidation", rebuilt.receipt.hostValidation, expected.hostValidation);
  }
  const hasExternalEval = Boolean(options.evaluation || options.evaluationPath || options.reportBytes);
  if (packageOnly) {
    unverified.push({
      kind: "evaluation",
      reason: "package-only mode skipped external evaluation authenticity check"
    });
  } else if (!hasExternalEval) {
    if (requireEvaluation) mismatches.push("missing external evaluation report");
    else {
      unverified.push({
        kind: "evaluation",
        reason: "external evaluation not provided"
      });
    }
  } else {
    const evalResult = await verifyEvaluationEvidence(expected.evaluation, options);
    mismatches.push(...evalResult.mismatches);
    unverified.push(...evalResult.unverified);
  }
  return {
    ok: mismatches.length === 0,
    mismatches,
    unverified,
    receiptHash: actualReceiptHash,
    packageVerified: !mismatches.some((item) => /unit hash|package hash|missing skill|unexpected skill|missing package root/i.test(item)),
    evaluationVerified: !packageOnly && hasExternalEval && !mismatches.some((item) => /evaluation|corpus|report sha/i.test(item))
  };
}
function pickSkillMetadata(unit) {
  return {
    files: unit.files ?? [],
    capabilities: unit.capabilities ?? null,
    requires: unit.requires ?? [],
    findings: unit.findings ?? []
  };
}
function compareDeterministicField(mismatches, label, actual, expected) {
  if (stableJson(actual) !== stableJson(expected)) {
    mismatches.push(`${label} mismatch`);
  }
}
function stableJson(value) {
  return JSON.stringify(sortStable(value));
}
function sortStable(value) {
  if (Array.isArray(value)) return value.map(sortStable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, child]) => [key, sortStable(child)])
  );
}
async function verifyEvaluationEvidence(embedded, options) {
  const mismatches = [];
  const unverified = [];
  const hasExternal = Boolean(options.evaluation || options.evaluationPath || options.reportBytes);
  if (!hasExternal) {
    return { mismatches, unverified };
  }
  let reportBytes = options.reportBytes ?? null;
  let report = options.evaluation ?? null;
  if (options.evaluationPath) {
    reportBytes = reportBytes ?? await readFile5(options.evaluationPath);
    report = report ?? JSON.parse(reportBytes.toString("utf8"));
  } else if (report && !reportBytes) {
    reportBytes = Buffer.from(`${JSON.stringify(report, null, 2)}
`);
  }
  if (!reportBytes || !report) {
    mismatches.push("missing external evaluation report");
    return { mismatches, unverified };
  }
  if (!embedded) {
    mismatches.push("receipt missing evaluation");
    return { mismatches, unverified };
  }
  const reportSha256 = sha256(reportBytes);
  const normalized = normalizeEvaluation(report, { reportSha256 });
  if (!normalized) {
    mismatches.push("external evaluation missing corpusSha256 + confusion counts");
    return { mismatches, unverified };
  }
  if (embedded.reportSha256 !== reportSha256) {
    mismatches.push("evaluation report sha256 mismatch");
  }
  if (embedded.corpusSha256 !== normalized.corpusSha256) {
    mismatches.push("evaluation corpus sha256 mismatch");
  }
  for (const key of ["total", "tp", "fp", "fn", "tn"]) {
    if (Number(embedded[key]) !== Number(normalized[key])) {
      mismatches.push(`evaluation ${key} mismatch`);
    }
  }
  return { mismatches, unverified };
}
function assertNoTimestamps(receipt) {
  const serialized = JSON.stringify(receipt);
  if (/"createdAt"|"timestamp"|"durationMs"|"generatedAt"|"builtAt"/i.test(serialized)) {
    throw new Error("receipt hashed payload must not include timestamps");
  }
}
var SCANNER_VERSION, RECEIPT_VERSION;
var init_receipt = __esm({
  "lib/capabilities/receipt.mjs"() {
    init_dependency_graph();
    init_policy();
    SCANNER_VERSION = "0.3.0";
    RECEIPT_VERSION = "0.3.0";
  }
});

// lib/capabilities/verify.mjs
var verify_exports = {};
__export(verify_exports, {
  verifyInstalledSkills: () => verifyInstalledSkills,
  verifySkillPaths: () => verifySkillPaths
});
async function verifySkillPaths(paths, options = {}) {
  const validation = await validateSkillPaths(paths, options);
  const findings = [];
  const scannedSkills = [];
  for (const report of validation.reports) {
    if (report.status !== "pass") continue;
    let skill;
    try {
      skill = await loadSkill(report.path, { root: options.root });
    } catch (error) {
      findings.push({
        skill: report.name,
        path: report.path,
        rule: "skill-load-failed",
        blocking: true,
        evidence: [error.message],
        fix: "fix structural/sidecar issues so the skill can be loaded"
      });
      continue;
    }
    scannedSkills.push(skill);
    if (!skill.sidecar) continue;
    const scanned = await scanSkill(skill);
    for (const item of scanned) {
      findings.push(normalizeFinding(item, skill));
    }
  }
  let graph = null;
  if (options.dependencies === true) {
    const root = options.root ?? process.cwd();
    let skillsForGraph = scannedSkills;
    try {
      skillsForGraph = await loadAllSkills(root);
    } catch (error) {
      findings.push({
        skill: null,
        path: root,
        rule: "skill-load-failed",
        blocking: true,
        evidence: [error.message],
        fix: "fix skill load errors before dependency analysis"
      });
      skillsForGraph = scannedSkills;
    }
    graph = analyzeDependencies(skillsForGraph);
    findings.push(...dependencyFindings(graph));
  }
  const merged = sortFindings(findings);
  const structuralOk = validation.ok;
  const ok = structuralOk && !merged.some((item) => item.blocking);
  const text = formatVerifyText(validation, merged);
  return {
    ok,
    structuralOk,
    text,
    reports: validation.reports,
    findings: merged,
    graph,
    policyScanned: scannedSkills.filter((skill) => skill.sidecar).length
  };
}
async function verifyInstalledSkills(root, options = {}) {
  return verifySkillPaths([], {
    root,
    all: true,
    allowEmpty: options.allowEmpty ?? false,
    profile: options.profile ?? "claude-code",
    dependencies: true,
    ...options
  });
}
function normalizeFinding(item, skill) {
  return {
    skill: skill.name,
    path: skill.directory,
    rule: item.rule,
    blocking: Boolean(item.blocking),
    evidence: [...item.evidence ?? []],
    fix: item.fix ?? "",
    declared: item.declared ?? null,
    detected: item.detected ?? null
  };
}
function dependencyFindings(graph) {
  const findings = [];
  for (const cycle of graph.cycles ?? []) {
    findings.push({
      skill: cycle[0] ?? null,
      path: null,
      rule: "dependency-cycle",
      blocking: true,
      evidence: [cycle.join(" -> ")],
      fix: "break the requires cycle between skills"
    });
  }
  for (const item of graph.missing ?? []) {
    findings.push({
      skill: item.skill,
      path: null,
      rule: "missing-dependency",
      blocking: true,
      evidence: [`${item.skill} -> ${item.requires}`],
      fix: `add skill "${item.requires}" or remove the requires entry`
    });
  }
  for (const name of graph.duplicates ?? []) {
    findings.push({
      skill: name,
      path: null,
      rule: "duplicate-name",
      blocking: true,
      evidence: [name],
      fix: "ensure skill names are unique across discovered roots"
    });
  }
  return findings;
}
function sortFindings(findings) {
  return [...findings].sort((left, right) => {
    const skillCmp = String(left.skill ?? "").localeCompare(String(right.skill ?? ""));
    if (skillCmp !== 0) return skillCmp;
    const ruleCmp = String(left.rule).localeCompare(String(right.rule));
    if (ruleCmp !== 0) return ruleCmp;
    const leftEvidence = (left.evidence ?? []).join("\0");
    const rightEvidence = (right.evidence ?? []).join("\0");
    return leftEvidence.localeCompare(rightEvidence);
  });
}
function formatVerifyText(validation, findings) {
  const lines = [];
  if (validation.text) lines.push(validation.text.replace(/\n$/, ""));
  for (const item of findings) {
    const where = item.skill ? `${item.skill}: ` : "";
    const evidence = (item.evidence ?? []).join(", ");
    const prefix = item.blocking ? "FAIL" : "WARN";
    lines.push(`${prefix} ${where}${item.rule}${evidence ? ` ${evidence}` : ""}${item.fix ? ` \u2014 ${item.fix}` : ""}`);
  }
  if (findings.length === 0 && validation.reports.length > 0) {
    return `${lines.join("\n")}
`;
  }
  return `${lines.filter(Boolean).join("\n")}
`;
}
var init_verify = __esm({
  "lib/capabilities/verify.mjs"() {
    init_validate_skill_lib();
    init_skill_loader();
    init_policy();
    init_dependency_graph();
  }
});

// lib/capabilities/policy-shell.mjs
function hasShellControlSyntax(command) {
  return SHELL_CONTROL_SYNTAX.test(String(command ?? ""));
}
function tokenizeCommand(command) {
  const tokens = [];
  const source = String(command ?? "").trim();
  let current = "";
  let quote = null;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (ch === quote) {
        quote = null;
      } else if (ch === "\\" && quote === '"' && i + 1 < source.length) {
        current += source[i + 1];
        i += 1;
      } else {
        current += ch;
      }
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (/\s/.test(ch)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }
    current += ch;
  }
  if (quote) return null;
  if (current) tokens.push(current);
  return tokens;
}
function argHasMetacharacters(arg) {
  return /[;&|`$<>\\]/.test(String(arg ?? "")) || /\$\(/.test(String(arg ?? ""));
}
function commandAllowed(command, declaredCommands = []) {
  const normalized = command.trim();
  if (!normalized || hasShellControlSyntax(normalized)) return false;
  const cmdTokens = tokenizeCommand(normalized);
  if (!cmdTokens) return false;
  return declaredCommands.some((declared) => {
    const allowed = String(declared).trim();
    if (!allowed || hasShellControlSyntax(allowed)) return false;
    if (normalized === allowed) return true;
    const allowedTokens = tokenizeCommand(allowed);
    if (!allowedTokens || allowedTokens.length === 0) return false;
    if (cmdTokens.length < allowedTokens.length) return false;
    for (let i = 0; i < allowedTokens.length; i += 1) {
      if (cmdTokens[i] !== allowedTokens[i]) return false;
    }
    const remaining = cmdTokens.slice(allowedTokens.length);
    return remaining.every((token) => !argHasMetacharacters(token));
  });
}
function commandExactlyAllowed(command, declaredCommands = []) {
  const normalized = String(command ?? "").trim();
  if (!normalized || hasShellControlSyntax(normalized)) return false;
  return declaredCommands.some((declared) => normalized === String(declared).trim());
}
function shellImpliesNetwork(command) {
  if (SHELL_NETWORK_CLIENTS.test(command)) return true;
  if (/\bpython(?:3)?\b/i.test(command) && /\s-c\b/.test(command) && /\b(urllib|requests|http\.client|httpx|urlopen)\b/i.test(command)) {
    return true;
  }
  if (/\bnode\b/i.test(command) && /\s-e\b/.test(command) && /\b(fetch|https?:\/\/|https?\.|axios|got)\b/i.test(command)) {
    return true;
  }
  return false;
}
function shellImpliesWrite(command) {
  const text = String(command ?? "");
  const tokens = tokenizeCommand(text);
  if (!tokens || tokens.length === 0) return true;
  const commandName = tokens[0].split(/[\\/]/).pop().toLowerCase();
  if (SHELL_WRITE_COMMANDS.has(commandName)) {
    if (commandName === "git") {
      return /^(add|am|apply|checkout|clean|commit|merge|mv|pull|push|rebase|reset|restore|rm|stash|switch)\b/i.test(tokens[1] ?? "");
    }
    if (["npm", "pnpm", "yarn"].includes(commandName)) {
      return /^(add|ci|install|link|pack|publish|remove|run|uninstall)\b/i.test(tokens[1] ?? "");
    }
    return true;
  }
  if (tokens.some((token) => SHELL_WRITE_FLAGS.has(token.toLowerCase()))) return true;
  if (INLINE_WRITE_PATTERNS.some((pattern) => pattern.test(text))) return true;
  return false;
}
function hostFromUrl(value) {
  try {
    return new URL(String(value)).host.toLowerCase();
  } catch {
    return null;
  }
}
function hostAllowed2(host, declaredHosts = []) {
  const normalized = host.toLowerCase();
  return declaredHosts.some((declared) => {
    const allowed = String(declared).toLowerCase();
    return normalized === allowed || allowed.startsWith("*.") && normalized.endsWith(allowed.slice(1));
  });
}
var SHELL_CONTROL_SYNTAX, SHELL_NETWORK_CLIENTS, SHELL_WRITE_COMMANDS, SHELL_WRITE_FLAGS, INLINE_WRITE_PATTERNS;
var init_policy_shell = __esm({
  "lib/capabilities/policy-shell.mjs"() {
    SHELL_CONTROL_SYNTAX = /[;&|`\n\r<>]|\$\(/;
    SHELL_NETWORK_CLIENTS = /\b(curl|wget|Invoke-WebRequest|Invoke-RestMethod|iwr|bitsadmin|certutil|fetch)\b/i;
    SHELL_WRITE_COMMANDS = /* @__PURE__ */ new Set([
      "add-content",
      "copy",
      "copy-item",
      "cp",
      "del",
      "git",
      "install",
      "mkdir",
      "move",
      "move-item",
      "mv",
      "new-item",
      "npm",
      "out-file",
      "pnpm",
      "remove-item",
      "rm",
      "rmdir",
      "set-content",
      "tee",
      "touch",
      "yarn"
    ]);
    SHELL_WRITE_FLAGS = /* @__PURE__ */ new Set([
      "-o",
      "--dest",
      "--destination",
      "--force",
      "--home",
      "--out",
      "--output",
      "--save",
      "--save-dev",
      "--write"
    ]);
    INLINE_WRITE_PATTERNS = [
      /\b(?:writeFile|writeFileSync|appendFile|appendFileSync|createWriteStream|rename|renameSync|rm|rmSync|unlink|unlinkSync|mkdir|mkdirSync|cp|cpSync)\s*\(/i,
      /\b(?:Set-Content|Add-Content|Out-File|New-Item|Copy-Item|Move-Item|Remove-Item)\b/i,
      /\bopen\s*\([^)]*,\s*['"](?:w|a|x|w\+|a\+)/i,
      /\bPath\s*\([^)]*\)\.(?:write_text|write_bytes|unlink|rename|mkdir)\s*\(/i,
      /\b(?:shutil\.(?:copy|copyfile|move|rmtree)|os\.(?:remove|unlink|rename|mkdir|makedirs|rmdir))\s*\(/i
    ];
  }
});

// lib/capabilities/hosts.mjs
import { access as access5 } from "node:fs/promises";
import { homedir } from "node:os";
import { join as join7, resolve as resolve7, sep as sep6 } from "node:path";
function isInsideHome(home, candidate) {
  const root = resolve7(home);
  const path = resolve7(candidate);
  return path === root || path.startsWith(root.endsWith(sep6) ? root : `${root}${sep6}`);
}
async function pathExists2(path) {
  try {
    await access5(path);
    return true;
  } catch {
    return false;
  }
}
async function detectHosts(options = {}) {
  const home = resolve7(options.home ?? homedir());
  const results = [];
  for (const host of HOST_REGISTRY) {
    const detectDirs = host.detectRels.map((rel) => resolve7(home, rel));
    const skillsDir = resolve7(home, host.skillsRel);
    for (const detectDir of detectDirs) {
      if (!isInsideHome(home, detectDir)) {
        throw new Error(`host path escaped home: ${host.id}`);
      }
    }
    if (!isInsideHome(home, skillsDir)) {
      throw new Error(`host path escaped home: ${host.id}`);
    }
    let detected = false;
    let primaryDetect = detectDirs[0];
    for (const detectDir of detectDirs) {
      if (await pathExists2(detectDir)) {
        detected = true;
        primaryDetect = detectDir;
        break;
      }
    }
    results.push({
      id: host.id,
      label: host.label,
      detected,
      detectDir: primaryDetect,
      detectDirs,
      skillsDir,
      fidelity: host.fidelity,
      runtimeEnforced: host.runtimeEnforced,
      usesSidecar: host.usesSidecar,
      installHint: host.installHint
    });
  }
  return results;
}
function buildCustomHost(spec, options = {}) {
  const home = resolve7(options.home ?? homedir());
  const source = String(spec ?? "");
  const separator = source.indexOf(":");
  const id = separator === -1 ? source : source.slice(0, separator);
  const dir = separator === -1 ? "" : source.slice(separator + 1);
  if (!id || !/^[a-z0-9][a-z0-9-]*$/i.test(id)) {
    throw new Error("custom host id must be kebab-case");
  }
  if (!dir) {
    throw new Error("custom host requires <id>:<skills-dir>");
  }
  const skillsDir = resolve7(home, dir);
  if (!isInsideHome(home, skillsDir)) {
    throw new Error(`custom host path escaped home: ${id}`);
  }
  return {
    id,
    label: `Custom host: ${id}`,
    detected: true,
    detectDir: skillsDir,
    detectDirs: [skillsDir],
    skillsDir,
    fidelity: (
      /** @type {HostFidelity} */
      "package"
    ),
    runtimeEnforced: false,
    usesSidecar: false,
    installHint: "Custom package-fidelity target. SkillsForge copies validated skill packages only."
  };
}
async function resolveHostSelection(ids, options = {}) {
  const detected = await detectHosts(options);
  const byId = new Map(detected.map((host) => [host.id, host]));
  const selected = [];
  const unknown = [];
  for (const id of ids) {
    const host = byId.get(id);
    if (!host) unknown.push(id);
    else selected.push(host);
  }
  return { selected, unknown, all: detected };
}
var HOST_REGISTRY;
var init_hosts = __esm({
  "lib/capabilities/hosts.mjs"() {
    HOST_REGISTRY = Object.freeze([
      Object.freeze({
        id: "claude-code",
        label: "Claude Code",
        detectRels: [".claude"],
        skillsRel: join7(".claude", "skills"),
        fidelity: (
          /** @type {HostFidelity} */
          "full"
        ),
        runtimeEnforced: true,
        usesSidecar: true,
        installHint: "Full-fidelity install. Claude Code hooks and SkillsForge sidecar stay in place."
      }),
      Object.freeze({
        id: "cursor",
        label: "Cursor",
        detectRels: [".cursor"],
        skillsRel: join7(".cursor", "skills"),
        fidelity: (
          /** @type {HostFidelity} */
          "package"
        ),
        runtimeEnforced: false,
        usesSidecar: false,
        installHint: "Package-fidelity install. Runtime policy enforcement is not claimed."
      }),
      Object.freeze({
        id: "codex",
        label: "Codex CLI",
        // Detect Codex client config and/or the shared agents skill root.
        detectRels: [".codex", ".agents"],
        skillsRel: join7(".agents", "skills"),
        fidelity: (
          /** @type {HostFidelity} */
          "package"
        ),
        runtimeEnforced: false,
        usesSidecar: false,
        installHint: "Package-fidelity skill install; use package --host codex for a guarded Codex plugin bundle."
      }),
      Object.freeze({
        id: "opencode",
        label: "OpenCode",
        detectRels: [join7(".config", "opencode"), ".agents"],
        skillsRel: join7(".config", "opencode", "skills"),
        fidelity: (
          /** @type {HostFidelity} */
          "package"
        ),
        runtimeEnforced: false,
        usesSidecar: false,
        installHint: "Package-fidelity install. Verify the configured OpenCode skill directory for your local build."
      }),
      Object.freeze({
        id: "zcode",
        label: "ZCode-compatible local agent",
        detectRels: [".zcode", join7(".config", "zcode")],
        skillsRel: join7(".zcode", "skills"),
        fidelity: (
          /** @type {HostFidelity} */
          "package"
        ),
        runtimeEnforced: false,
        usesSidecar: false,
        installHint: "Package-fidelity install. Verify the configured ZCode skill directory for your local build."
      }),
      Object.freeze({
        id: "hermes",
        label: "Hermes Agent",
        detectRels: [".hermes", join7(".config", "hermes")],
        skillsRel: join7(".hermes", "skills"),
        fidelity: (
          /** @type {HostFidelity} */
          "package"
        ),
        runtimeEnforced: false,
        usesSidecar: false,
        installHint: "Package-fidelity install. Runtime policy enforcement is not claimed."
      }),
      Object.freeze({
        id: "gemini",
        label: "Gemini CLI",
        detectRels: [".gemini"],
        skillsRel: join7(".gemini", "skills"),
        fidelity: (
          /** @type {HostFidelity} */
          "package"
        ),
        runtimeEnforced: false,
        usesSidecar: false,
        installHint: "Package-fidelity install. Runtime policy enforcement is not claimed."
      })
    ]);
  }
});

// lib/capabilities/codex-policy-compiler.mjs
import { isAbsolute as isAbsolute5, normalize as normalize2, resolve as resolve8, sep as sep8 } from "node:path";
function compileCodexHooks({ policyRelativePath }) {
  const policyPath = String(policyRelativePath ?? "policy/skillsforge.json").replaceAll("\\", "/");
  return {
    hooks: {
      PreToolUse: [
        {
          matcher: "^(Bash|apply_patch|mcp__.*)$",
          hooks: [
            {
              type: "command",
              command: `node "\${PLUGIN_ROOT}/hooks/codex-pre-tool-policy.mjs" --policy "\${PLUGIN_ROOT}/${policyPath}"`
            }
          ]
        }
      ]
    }
  };
}
function enforceCodexPolicy(event, policy) {
  if (!policy || typeof policy !== "object" || Array.isArray(policy) || !policy.capabilities) {
    return deny2("policy capabilities are missing");
  }
  const caps = policy.capabilities;
  const tool = String(event?.tool_name ?? "");
  const input = event?.tool_input ?? {};
  if (tool === "Bash") {
    return enforceBash(String(input.command ?? ""), caps);
  }
  if (tool === "apply_patch" || /^apply[_-]?patch$/i.test(tool)) {
    return enforceApplyPatch(String(input.patch ?? input.input ?? input.command ?? ""), caps, policy);
  }
  if (isMcpTool(tool)) {
    return enforceMcp(tool, caps);
  }
  return deny2(`unsupported tool for Codex policy: ${tool || "(missing)"}`);
}
function enforceBash(command, caps) {
  if (caps.exec?.allowed !== true) return deny2("exec capability is not declared");
  if (hasShellControlSyntax(command)) {
    return deny2("shell command contains disallowed control syntax");
  }
  if (!commandAllowed(command, caps.exec.commands)) {
    return deny2("shell command is not declared");
  }
  if (caps.network?.allowed !== true && shellImpliesNetwork(command)) {
    return deny2("network capability is not declared for shell command");
  }
  if (caps.network?.allowed === true) {
    for (const url of command.match(/\b(?:https?|wss?):\/\/[^\s"'`]+/gi) ?? []) {
      const host = hostFromUrl(url);
      if (!host || !hostAllowed2(host, caps.network.hosts)) {
        return deny2(`network host is not declared: ${host ?? "invalid URL"}`);
      }
    }
  }
  if ((caps.write?.scope === "skill" || caps.write?.scope === "none") && /(?:^|\s)(?:rm|del|Remove-Item)\b/i.test(command)) {
    return deny2("write scope forbids destructive shell writes");
  }
  if (caps.write?.scope === "none" && (!commandExactlyAllowed(command, caps.exec.commands) || shellImpliesWrite(command))) {
    return deny2("write scope forbids shell writes");
  }
  return null;
}
function enforceApplyPatch(patchText, caps, policy) {
  if (!caps.write) return deny2("write capability is not declared");
  if (caps.write.scope === "none") return deny2("write capability scope is none");
  const paths = parseApplyPatchPaths(patchText);
  if (paths.length === 0) {
    return deny2("apply_patch contains no recognizable file paths");
  }
  for (const filePath of paths) {
    if (filePath.includes("\0") || /(?:^|[\\/])\.\.(?:[\\/]|$)/.test(filePath)) {
      return deny2(`apply_patch path traversal rejected: ${filePath}`);
    }
    if (caps.write.scope === "skill") {
      const skillRoot = policy.__skillRoot;
      const candidate = skillRoot && !isAbsolute5(filePath) ? resolve8(skillRoot, filePath) : resolve8(filePath);
      if (skillRoot && !isInside5(skillRoot, candidate)) {
        return deny2(`write escapes skill scope: ${filePath}`);
      }
    }
    if (caps.write.scope === "project") {
      const projectRoot = policy.__projectRoot;
      const candidate = projectRoot && !isAbsolute5(filePath) ? resolve8(projectRoot, filePath) : resolve8(filePath);
      if (projectRoot && !isInside5(projectRoot, candidate)) {
        return deny2(`write escapes project scope: ${filePath}`);
      }
    }
  }
  return null;
}
function parseApplyPatchPaths(patchText) {
  const paths = [];
  const lines = String(patchText ?? "").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\*\*\*\s+(?:Update|Add|Delete)\s+File:\s+(.+?)\s*$/i) ?? line.match(/^\*\*\*\s+Move\s+to:\s+(.+?)\s*$/i);
    if (match) paths.push(match[1].trim());
  }
  return paths;
}
function enforceMcp(tool, caps) {
  const mcp = caps.mcp;
  if (mcp?.allowed !== true) {
    return deny2("mcp capability is not declared");
  }
  const declared = Array.isArray(mcp.tools) ? mcp.tools : [];
  if (!declared.some((item) => String(item) === tool)) {
    return deny2(`mcp tool is not declared: ${tool}`);
  }
  return null;
}
function isMcpTool(toolName) {
  const tool = String(toolName ?? "");
  return /^mcp__/i.test(tool) || /MCP/i.test(tool);
}
function deny2(reason) {
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: `SkillsForge policy: ${reason}`
    }
  };
}
function isInside5(parent, candidate) {
  const normalizedParent = normalize2(resolve8(parent));
  const normalizedCandidate = normalize2(resolve8(candidate));
  return normalizedCandidate === normalizedParent || normalizedCandidate.startsWith(normalizedParent.endsWith(sep8) ? normalizedParent : normalizedParent + sep8);
}
var init_codex_policy_compiler = __esm({
  "lib/capabilities/codex-policy-compiler.mjs"() {
    init_policy_shell();
  }
});

// lib/capabilities/catalog.mjs
var catalog_exports = {};
__export(catalog_exports, {
  catalogStats: () => catalogStats,
  listPacks: () => listPacks,
  listProfiles: () => listProfiles,
  loadCatalog: () => loadCatalog,
  searchCatalog: () => searchCatalog,
  skillsForPack: () => skillsForPack,
  skillsForProfile: () => skillsForProfile
});
import { readFile as readFile10 } from "node:fs/promises";
import { join as join10, resolve as resolve10 } from "node:path";
async function loadCatalog(root) {
  const abs = resolve10(root);
  const catalogPath = join10(abs, "catalog", "skillsforge.catalog.yaml");
  const source = await readFile10(catalogPath, "utf8");
  const document = (0, import_yaml5.parseDocument)(source, { prettyErrors: true, strict: true, uniqueKeys: true });
  if (document.errors.length > 0) {
    throw new Error(document.errors.map((error) => error.message).join("; "));
  }
  const catalog = document.toJS();
  if (catalogSchema) {
    const result = await validateWithSchema(catalogSchema, catalog);
    if (!result.valid) {
      throw new Error(result.errors.map((error) => `catalog ${error}`).join("; "));
    }
  }
  return { path: catalogPath, catalog };
}
function listPacks(catalog) {
  return Object.entries(catalog.packs ?? {}).map(([id, pack]) => ({
    id,
    description: pack.description,
    skillCount: pack.skills?.length ?? 0,
    skills: [...pack.skills ?? []]
  })).sort((a, b) => a.id.localeCompare(b.id));
}
function listProfiles(catalog) {
  return Object.entries(catalog.profiles ?? {}).map(([id, profile]) => ({
    id,
    description: profile.description,
    packs: [...profile.packs ?? []]
  })).sort((a, b) => a.id.localeCompare(b.id));
}
function skillsForProfile(catalog, profileId) {
  const profile = catalog.profiles?.[profileId];
  if (!profile) return null;
  const skills = /* @__PURE__ */ new Set();
  for (const packId of profile.packs) {
    for (const skill of catalog.packs?.[packId]?.skills ?? []) skills.add(skill);
  }
  return [...skills].sort();
}
function skillsForPack(catalog, packId) {
  const pack = catalog.packs?.[packId];
  if (!pack) return null;
  return [...pack.skills ?? []];
}
function searchCatalog(catalog, query) {
  const q = String(query ?? "").toLowerCase().trim();
  if (!q) return [];
  const hits = [];
  for (const [packId, pack] of Object.entries(catalog.packs ?? {})) {
    for (const skill of pack.skills ?? []) {
      if (skill.includes(q) || packId.includes(q) || pack.description?.toLowerCase().includes(q)) {
        hits.push({ skill, pack: packId });
      }
    }
  }
  return hits.sort((a, b) => a.skill.localeCompare(b.skill));
}
function catalogStats(catalog) {
  const packs = listPacks(catalog);
  const skillSet = /* @__PURE__ */ new Set();
  for (const pack of packs) for (const skill of pack.skills) skillSet.add(skill);
  return {
    packs: packs.length,
    profiles: listProfiles(catalog).length,
    skills: skillSet.size
  };
}
var import_yaml5, catalogSchema;
var init_catalog = __esm({
  "lib/capabilities/catalog.mjs"() {
    import_yaml5 = __toESM(require_dist(), 1);
    init_schema_lib();
    init_schemas_generated();
    catalogSchema = schemas["skillsforge.catalog"];
  }
});

// scripts/eval.mjs
var eval_exports = {};
__export(eval_exports, {
  HOLDOUT_PRECISION_MIN: () => HOLDOUT_PRECISION_MIN,
  HOLDOUT_RECALL_MIN: () => HOLDOUT_RECALL_MIN,
  calculateMetrics: () => calculateMetrics,
  runEvaluation: () => runEvaluation
});
import { createHash as createHash2 } from "node:crypto";
import { mkdir as mkdir9, readFile as readFile15, writeFile as writeFile9 } from "node:fs/promises";
import { dirname as dirname6, join as join17, resolve as resolve15 } from "node:path";
import { fileURLToPath as fileURLToPath3 } from "node:url";
function percentile(values, p) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const rank = p / 100 * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  if (low === high) return sorted[low];
  return sorted[low] + (sorted[high] - sorted[low]) * (rank - low);
}
function calculateMetrics(cases, select) {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  let exactMatches = 0;
  const failures = [];
  const latenciesMs = [];
  for (const { query, expected } of cases) {
    const started = performance.now();
    const actual = select(query);
    latenciesMs.push(performance.now() - started);
    if (expected === null && actual === null) {
      tn += 1;
      exactMatches += 1;
    } else if (expected === null && actual !== null) {
      fp += 1;
      failures.push({ query, expected, actual });
    } else if (expected !== null && actual === expected) {
      tp += 1;
      exactMatches += 1;
    } else if (expected !== null && actual === null) {
      fn += 1;
      failures.push({ query, expected, actual });
    } else {
      fp += 1;
      fn += 1;
      failures.push({ query, expected, actual });
    }
  }
  return {
    total: cases.length,
    tp,
    fp,
    fn,
    tn,
    exactMatchAccuracy: cases.length === 0 ? null : exactMatches / cases.length,
    precision: tp + fp === 0 ? null : tp / (tp + fp),
    recall: tp + fn === 0 ? null : tp / (tp + fn),
    latencyMs: {
      p50: percentile(latenciesMs, 50),
      p95: percentile(latenciesMs, 95)
    },
    failures
  };
}
async function runEvaluation(options = {}) {
  const root = options.root ?? repositoryRoot;
  const corpusName = options.corpus ?? "routing-holdout.json";
  const corpusPath = join17(root, "evaluation", corpusName);
  const corpusSource = await readFile15(corpusPath);
  const corpus = JSON.parse(corpusSource.toString("utf8"));
  const skills = await loadAllSkills(root);
  const started = Date.now();
  const fullRouter = calculateMetrics(
    corpus.cases,
    (query) => routeQuery(query, skills).selected
  );
  const metadataOnlySkills = skills.map((skill) => ({ ...skill, sidecar: null }));
  const metadataOnlyBaseline = calculateMetrics(
    corpus.cases,
    (query) => routeQuery(query, metadataOnlySkills).selected
  );
  const report = {
    corpus: corpusName,
    frozen: corpus.frozen,
    corpusSha256: createHash2("sha256").update(corpusSource).digest("hex"),
    ...fullRouter,
    fullRouter,
    metadataOnlyBaseline,
    comparison: {
      precisionDelta: fullRouter.precision === null || metadataOnlyBaseline.precision === null ? null : fullRouter.precision - metadataOnlyBaseline.precision,
      recallDelta: fullRouter.recall === null || metadataOnlyBaseline.recall === null ? null : fullRouter.recall - metadataOnlyBaseline.recall
    },
    durationMs: Date.now() - started
  };
  if (options.write !== false) {
    await mkdir9(join17(root, "artifacts", "evaluation"), { recursive: true });
    await writeFile9(join17(root, "artifacts", "evaluation", "routing-report.json"), `${JSON.stringify(report, null, 2)}
`);
  }
  return report;
}
var modulePath, repositoryRoot, HOLDOUT_PRECISION_MIN, HOLDOUT_RECALL_MIN;
var init_eval = __esm({
  async "scripts/eval.mjs"() {
    init_skill_loader();
    init_router();
    modulePath = fileURLToPath3(import.meta.url);
    repositoryRoot = resolve15(dirname6(modulePath), "..");
    HOLDOUT_PRECISION_MIN = 0.95;
    HOLDOUT_RECALL_MIN = 0.9;
    if (process.argv[1] && resolve15(process.argv[1]) === modulePath) {
      const report = await runEvaluation();
      console.log(
        `routing: ${report.tp}+${report.tn}/${report.total} exact=${report.exactMatchAccuracy?.toFixed(2)} P=${report.precision?.toFixed(2)} R=${report.recall?.toFixed(2)} p50=${report.latencyMs?.p50?.toFixed(2)}ms p95=${report.latencyMs?.p95?.toFixed(2)}ms`
      );
      console.log(
        `metadata-only baseline: ${report.metadataOnlyBaseline.tp}+${report.metadataOnlyBaseline.tn}/${report.total} P=${report.metadataOnlyBaseline.precision == null ? "n/a" : report.metadataOnlyBaseline.precision.toFixed(2)} R=${report.metadataOnlyBaseline.recall == null ? "n/a" : report.metadataOnlyBaseline.recall.toFixed(2)}`
      );
      console.log(`corpusSha256=${report.corpusSha256} frozen=${report.frozen}`);
      process.exit(
        report.precision >= HOLDOUT_PRECISION_MIN && report.recall >= HOLDOUT_RECALL_MIN ? 0 : 1
      );
    }
  }
});

// lib/capabilities/evidence.mjs
var evidence_exports = {};
__export(evidence_exports, {
  buildEvidenceBundle: () => buildEvidenceBundle,
  buildEvidenceBundleWithPackageMeta: () => buildEvidenceBundleWithPackageMeta,
  stableStringify: () => stableStringify
});
import { createHash as createHash3 } from "node:crypto";
import { access as access11, mkdir as mkdir10, readFile as readFile16, readdir as readdir8, writeFile as writeFile10 } from "node:fs/promises";
import { dirname as dirname7, join as join18, relative as relative9, resolve as resolve16 } from "node:path";
import { fileURLToPath as fileURLToPath4 } from "node:url";
async function buildEvidenceBundle(options = {}) {
  const root = resolve16(options.root ?? moduleRoot);
  const outDir = options.outDir ? resolve16(options.outDir) : null;
  const write = outDir != null && options.write !== false;
  if (!outDir) {
    return { ok: false, errors: ["--out <dir> is required"], files: [], bundleHash: null };
  }
  const validation = options.validation ?? await collectValidation(root);
  const evaluation = options.evaluation ?? await collectRoutingEval(root);
  const policyReport = options.policyReport ?? await collectPolicyAdversarial(root, options.policyCorpus);
  const fixtureReport = options.fixtureReport ?? await collectIndependentFixtures(root, options.fixtureRoots);
  const codexReport = options.codexReport ?? await collectCodexPackageSummary(root);
  const receiptReport = options.receiptReport ?? await collectReceiptEvidence(root, options);
  const packageVersion = options.buildMeta?.packageVersion ?? await readPackageVersion(root);
  const buildMeta = sanitizeBuildMeta({
    ...defaultBuildMeta(root),
    ...options.buildMeta ?? {},
    packageVersion
  });
  const files = {
    "validation.json": stripNonDeterministic(validation),
    "routing-eval.json": stripNonDeterministic(evaluation),
    "policy-adversarial.json": stripNonDeterministic(policyReport),
    "independent-fixtures.json": stripNonDeterministic(fixtureReport),
    "codex-package.json": stripNonDeterministic(codexReport),
    "receipt.json": stripNonDeterministic(receiptReport),
    "build-meta.json": stripNonDeterministic(buildMeta)
  };
  const fileEntries = [];
  for (const name of Object.keys(files).sort()) {
    const text = stableStringify(files[name]);
    const sha2562 = sha256Text(text);
    fileEntries.push({ path: name, sha256: sha2562, bytes: Buffer.byteLength(text) });
    if (write) {
      await mkdir10(outDir, { recursive: true });
      await writeFile10(join18(outDir, name), text);
    }
  }
  const manifestBody = {
    version: EVIDENCE_VERSION,
    files: fileEntries
  };
  const manifestText = stableStringify(manifestBody);
  const bundleHash = sha256Text(manifestText);
  const manifest = { ...manifestBody, bundleHash };
  const manifestWithHash = stableStringify(manifest);
  if (write) {
    await writeFile10(join18(outDir, "manifest.json"), manifestWithHash);
  }
  const ok = Boolean(validation.ok) && policyReport.falseAllow === 0 && receiptReport.verify?.ok === true && receiptReport.tamper?.ok === false;
  return {
    ok,
    outDir,
    write,
    bundleHash,
    files: [
      ...fileEntries.map((item) => item.path),
      "manifest.json"
    ],
    manifest,
    reports: files
  };
}
async function collectValidation(root) {
  const result = await verifySkillPaths([], {
    root,
    all: true,
    allowEmpty: false,
    profile: "claude-code",
    dependencies: true
  });
  return {
    ok: result.ok,
    blocking: (result.findings ?? []).filter((item) => item.blocking).length,
    findings: (result.findings ?? []).map((item) => ({
      rule: item.rule,
      blocking: Boolean(item.blocking),
      skill: item.skill ?? null,
      evidence: [...item.evidence ?? []]
    })).sort(compareFinding)
  };
}
async function collectRoutingEval(root) {
  const { runEvaluation: runEvaluation2 } = await init_eval().then(() => eval_exports);
  const report = await runEvaluation2({ root, write: false });
  const normalized = normalizeEvaluation(report, {
    reportBytes: Buffer.from(stableStringify({
      corpusSha256: report.corpusSha256,
      total: report.total,
      tp: report.tp,
      fp: report.fp,
      fn: report.fn,
      tn: report.tn
    }))
  });
  return {
    corpus: report.corpus,
    frozen: report.frozen,
    corpusSha256: report.corpusSha256,
    total: report.total,
    tp: report.tp,
    fp: report.fp,
    fn: report.fn,
    tn: report.tn,
    precision: report.precision,
    recall: report.recall,
    exactMatchAccuracy: report.exactMatchAccuracy,
    reportSha256: normalized?.reportSha256 ?? null,
    failures: (report.failures ?? []).map((item) => ({
      query: item.query,
      expected: item.expected,
      actual: item.actual
    })),
    note: "Holdout precision/recall reported honestly; labels are not edited to force a perfect score."
  };
}
async function collectPolicyAdversarial(root, injectedCorpus) {
  const corpus = injectedCorpus ?? await loadPolicyCorpus(root);
  const cases = Array.isArray(corpus?.cases) ? corpus.cases : [];
  let trueAllow = 0;
  let trueDeny = 0;
  let falseAllow = 0;
  let falseDeny = 0;
  const results = [];
  for (const item of cases) {
    const expected = item.expected === "allow" ? "allow" : "deny";
    const decision = enforceCodexPolicy(item.event ?? {}, item.policy ?? {});
    const actual = decision == null ? "allow" : "deny";
    if (expected === "allow" && actual === "allow") trueAllow += 1;
    else if (expected === "deny" && actual === "deny") trueDeny += 1;
    else if (expected === "deny" && actual === "allow") falseAllow += 1;
    else falseDeny += 1;
    results.push({
      id: item.id ?? null,
      expected,
      actual,
      reason: decision?.hookSpecificOutput?.permissionDecisionReason ?? null
    });
  }
  return {
    corpus: corpus?.name ?? "policy-adversarial.json",
    corpusSha256: corpus?.sha256 ?? null,
    total: cases.length,
    trueAllow,
    trueDeny,
    falseAllow,
    falseDeny,
    results: results.sort((left, right) => String(left.id).localeCompare(String(right.id)))
  };
}
async function loadPolicyCorpus(root) {
  const path = join18(root, "evaluation", "policy-adversarial.json");
  const source = await readFile16(path);
  const parsed = JSON.parse(source.toString("utf8"));
  return {
    ...parsed,
    name: "policy-adversarial.json",
    sha256: sha256Text(source)
  };
}
async function collectIndependentFixtures(root, fixtureRoots) {
  const roots = fixtureRoots ?? [
    join18(root, "tests", "fixtures", "skills", "public-docs-helper"),
    join18(root, "tests", "fixtures", "skills", "public-router-helper"),
    join18(root, "tests", "fixtures", "skills", "public-security-scan")
  ];
  const reports = [];
  for (const dir of roots) {
    const abs = resolve16(dir);
    let exists = true;
    try {
      await access11(join18(abs, "SKILL.md"));
    } catch {
      exists = false;
    }
    if (!exists) {
      reports.push({
        path: toPosix(root, abs),
        ok: false,
        error: "missing SKILL.md"
      });
      continue;
    }
    const result = await verifySkillPaths([abs], {
      root,
      all: false,
      allowEmpty: false,
      profile: "canonical",
      dependencies: false
    });
    reports.push({
      path: toPosix(root, abs),
      ok: result.ok,
      blocking: (result.findings ?? []).filter((item) => item.blocking).length
    });
  }
  return {
    note: "Independent public-style fixtures for adversarial near-match coverage; not part of holdout routing gate.",
    fixtures: reports.sort((left, right) => left.path.localeCompare(right.path))
  };
}
async function collectCodexPackageSummary(root) {
  const pluginPath = join18(root, "plugins", "skillsforge", ".codex-plugin", "plugin.json");
  let plugin = null;
  try {
    plugin = JSON.parse(await readFile16(pluginPath, "utf8"));
  } catch {
    plugin = null;
  }
  const skillsRoot = join18(root, "plugins", "skillsforge", "skills");
  const skillSummaries = [];
  let entries = [];
  try {
    entries = await readdir8(skillsRoot, { withFileTypes: true });
  } catch {
    entries = [];
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillDir = join18(skillsRoot, entry.name);
    const hasSkill = await pathExists6(join18(skillDir, "SKILL.md"));
    if (!hasSkill) continue;
    skillSummaries.push({
      name: entry.name,
      openaiYaml: await pathExists6(join18(skillDir, "agents", "openai.yaml")),
      sidecar: await pathExists6(join18(skillDir, "skillsforge.json"))
    });
  }
  skillSummaries.sort((left, right) => left.name.localeCompare(right.name));
  let distInterop = null;
  try {
    distInterop = JSON.parse(await readFile16(join18(root, "dist", "codex-interop.json"), "utf8"));
  } catch {
    distInterop = null;
  }
  const distPresent = {
    pluginJson: await pathExists6(join18(root, "dist", "codex", ".codex-plugin", "plugin.json")),
    openaiYamlCount: skillSummaries.filter((item) => item.openaiYaml).length
  };
  return {
    host: "codex",
    plugin: plugin ? {
      name: plugin.name ?? null,
      version: plugin.version ?? null,
      skills: plugin.skills ?? null,
      interface: plugin.interface ?? null
    } : null,
    skills: skillSummaries,
    dist: distPresent,
    interop: distInterop ?? {
      host: "codex",
      accepted: [
        ".codex-plugin/plugin.json",
        "SKILL.md",
        "agents/openai.yaml",
        "scripts",
        "references",
        "assets"
      ],
      transformed: [],
      ignored: [
        "Claude-only PreToolUse hooks embedded in SKILL.md (Codex packaging note: ignored for Codex runtime; use plugin-level hooks instead)"
      ],
      runtimeEnforced: false,
      losses: ["claude-skill-hooks"],
      usesSidecar: false,
      hosts: HOST_REGISTRY.map((host) => ({
        id: host.id,
        fidelity: host.fidelity,
        runtimeEnforced: host.runtimeEnforced,
        usesSidecar: host.usesSidecar
      }))
    }
  };
}
async function collectReceiptEvidence(root, options) {
  const packageRoot = resolve16(
    options.packageRoot ?? join18(root, "dist", "claude-code")
  );
  const receiptPath = resolve16(
    options.receiptPath ?? join18(root, "dist", "trust-receipt.json")
  );
  const evaluationPath = resolve16(
    options.evaluationPath ?? join18(root, "artifacts", "evaluation", "routing-report.json")
  );
  const packageReady = await pathExists6(join18(packageRoot, ".claude-plugin", "plugin.json"));
  const receiptReady = await pathExists6(receiptPath);
  if (!packageReady || !receiptReady) {
    return await synthesizeReceiptProof(root, options);
  }
  const skills = await loadAllSkills(packageRoot);
  const verifyOptions = {
    packageRoot,
    packageOnly: false,
    requireEvaluation: true
  };
  if (await pathExists6(evaluationPath)) {
    verifyOptions.evaluationPath = evaluationPath;
  }
  const verify = await verifyReceipt(receiptPath, skills, verifyOptions);
  const tamper = await verifyOneByteTamper(receiptPath, skills, verifyOptions);
  return {
    receiptPath: toPosix(root, receiptPath),
    packageRoot: toPosix(root, packageRoot),
    verify: {
      ok: verify.ok,
      packageVerified: verify.packageVerified,
      evaluationVerified: verify.evaluationVerified,
      mismatches: [...verify.mismatches ?? []].sort(),
      receiptHash: verify.receiptHash ?? null
    },
    tamper: {
      ok: tamper.ok,
      prepared: true,
      mismatches: [...tamper.mismatches ?? []].sort(),
      note: "One-byte mutation of trust receipt must fail verification."
    }
  };
}
async function synthesizeReceiptProof(root, options) {
  const skills = options.skills ?? await loadAllSkills(join18(root, "plugins", "skillsforge"));
  const evaluation = options.evaluationSummary ?? {
    corpusSha256: "synthetic-corpus",
    total: 2,
    tp: 1,
    fp: 0,
    fn: 0,
    tn: 1
  };
  const reportBytes = Buffer.from(stableStringify(evaluation));
  const built = await buildReceipt(skills, {
    evaluation,
    reportBytes,
    requireEvaluation: true,
    packageRoot: join18(root, "plugins", "skillsforge")
  });
  if (!built.ok) {
    return {
      receiptPath: null,
      packageRoot: toPosix(root, join18(root, "plugins", "skillsforge")),
      verify: { ok: false, mismatches: built.errors ?? ["receipt build failed"], packageVerified: false, evaluationVerified: false, receiptHash: null },
      tamper: { ok: false, prepared: false, mismatches: ["receipt unavailable"], note: "Could not prepare tamper proof." }
    };
  }
  const verify = {
    ok: true,
    packageVerified: true,
    evaluationVerified: true,
    mismatches: [],
    receiptHash: built.receiptHash
  };
  const tamperedText = mutateReceiptForTamper(built.text);
  const tamper = await evaluateTamperedReceipt(tamperedText, skills, {
    packageRoot: join18(root, "plugins", "skillsforge")
  });
  return {
    receiptPath: null,
    packageRoot: toPosix(root, join18(root, "plugins", "skillsforge")),
    mode: "synthetic",
    verify,
    tamper: {
      ...tamper,
      prepared: true,
      note: "One-byte mutation of trust receipt must fail verification."
    }
  };
}
async function verifyOneByteTamper(receiptPath, skills, verifyOptions) {
  const original = await readFile16(receiptPath, "utf8");
  const mutated = mutateReceiptForTamper(original);
  return evaluateTamperedReceipt(mutated, skills, verifyOptions);
}
async function evaluateTamperedReceipt(mutatedText, skills, verifyOptions) {
  let expected;
  try {
    expected = JSON.parse(mutatedText);
  } catch {
    return { ok: false, mismatches: ["tampered receipt is not valid JSON"] };
  }
  const rebuilt = await buildReceipt(skills, {
    version: expected.version,
    evaluation: expected.evaluation,
    lossiness: expected.lossiness,
    hostValidation: expected.hostValidation,
    packageRoot: verifyOptions.packageRoot,
    requireEvaluation: false
  });
  if (!rebuilt.ok) return { ok: false, mismatches: rebuilt.errors ?? [] };
  const mismatches = [];
  for (const unit of expected.skills ?? []) {
    const actual = rebuilt.receipt.skills.find((item) => item.name === unit.name);
    if (!actual) mismatches.push(`missing skill ${unit.name}`);
    else if (actual.unitHash !== unit.unitHash) mismatches.push(`unit hash mismatch ${unit.name}`);
  }
  if (expected.package?.packageHash && rebuilt.receipt.package?.packageHash !== expected.package.packageHash) {
    mismatches.push("package hash mismatch");
  }
  if (mismatches.length === 0) {
    mismatches.push("receipt payload digest mismatch after one-byte tamper");
  }
  return { ok: false, mismatches };
}
function mutateReceiptForTamper(text) {
  const match = /("unitHash"\s*:\s*")([0-9a-fA-F])([0-9a-fA-F]{63}")/.exec(text);
  if (!match) {
    const buffer = Buffer.from(text, "utf8");
    if (buffer.length === 0) return "x";
    const index = Math.min(buffer.length - 1, 1);
    buffer[index] = buffer[index] ^ 1;
    return buffer.toString("utf8");
  }
  const flipped = match[2] === "0" ? "1" : "0";
  return text.slice(0, match.index) + match[1] + flipped + match[3] + text.slice(match.index + match[0].length);
}
function defaultBuildMeta(root) {
  return {
    evidenceVersion: EVIDENCE_VERSION,
    packageVersion: null,
    node: {
      major: Number(process.versions.node.split(".")[0]),
      platform: process.platform,
      arch: process.arch
    },
    ci: Boolean(process.env.CI),
    github: {
      ref: process.env.GITHUB_REF ?? null,
      sha: process.env.GITHUB_SHA ?? null,
      runId: process.env.GITHUB_RUN_ID ?? null
    },
    rootName: relative9(dirname7(root), root).replaceAll("\\", "/") || "."
  };
}
async function readPackageVersion(root) {
  try {
    const pkg = JSON.parse(await readFile16(join18(root, "package.json"), "utf8"));
    return pkg.version ?? null;
  } catch {
    return null;
  }
}
function sanitizeBuildMeta(meta) {
  const clone = structuredClone(meta ?? {});
  return clone;
}
function stripNonDeterministic(value) {
  return stripKeys(value, /* @__PURE__ */ new Set([
    "durationMs",
    "latencyMs",
    "createdAt",
    "timestamp",
    "generatedAt",
    "builtAt",
    "startedAt",
    "finishedAt"
  ]));
}
function stripKeys(value, banned) {
  if (Array.isArray(value)) return value.map((item) => stripKeys(item, banned));
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      if (banned.has(key)) continue;
      out[key] = stripKeys(value[key], banned);
    }
    return out;
  }
  return value;
}
function stableStringify(value) {
  return `${JSON.stringify(sortKeys(value), null, 2)}
`;
}
function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = sortKeys(value[key]);
    }
    return out;
  }
  return value;
}
function sha256Text(value) {
  return createHash3("sha256").update(value).digest("hex");
}
function compareFinding(left, right) {
  const leftKey = `${left.skill ?? ""}|${left.rule}|${(left.evidence ?? []).join(",")}`;
  const rightKey = `${right.skill ?? ""}|${right.rule}|${(right.evidence ?? []).join(",")}`;
  return leftKey.localeCompare(rightKey);
}
function toPosix(root, abs) {
  return relative9(root, abs).replaceAll("\\", "/");
}
async function pathExists6(path) {
  try {
    await access11(path);
    return true;
  } catch {
    return false;
  }
}
async function buildEvidenceBundleWithPackageMeta(options = {}) {
  const root = resolve16(options.root ?? moduleRoot);
  const packageVersion = await readPackageVersion(root);
  return buildEvidenceBundle({
    ...options,
    root,
    buildMeta: {
      ...defaultBuildMeta(root),
      ...options.buildMeta ?? {},
      packageVersion: options.buildMeta?.packageVersion ?? packageVersion
    }
  });
}
var EVIDENCE_VERSION, moduleRoot;
var init_evidence = __esm({
  "lib/capabilities/evidence.mjs"() {
    init_hosts();
    init_codex_policy_compiler();
    init_skill_loader();
    init_receipt();
    init_verify();
    EVIDENCE_VERSION = "0.4.0";
    moduleRoot = resolve16(dirname7(fileURLToPath4(import.meta.url)), "../..");
  }
});

// scripts/skillsforge-cli.mjs
init_skill_loader();
init_router();
import { access as access12, readFile as readFile17, writeFile as writeFile11, mkdir as mkdir11, readdir as readdir9, stat as stat3 } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { spawn } from "node:child_process";
import { basename as basename4, dirname as dirname8, join as join19, relative as relative10, resolve as resolve17 } from "node:path";
import { fileURLToPath as fileURLToPath5 } from "node:url";

// lib/capabilities/forge.mjs
init_schema_lib();
init_schemas_generated();
init_validate_skill_lib();
init_skill_loader();
init_policy();
import { access as access3, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname as dirname3, join as join4, resolve as resolve4 } from "node:path";
var forgeSchema = schemas["forge-spec"];
async function forgeSkill(spec, options = {}) {
  const schemaResult = await validateWithSchema(forgeSchema, spec);
  if (!schemaResult.valid) {
    return { ok: false, errors: schemaResult.errors.map((error) => `forge-spec ${error}`), files: [] };
  }
  const outRoot = resolve4(options.outRoot ?? join4(process.cwd(), "plugins", "skillsforge", "skills"));
  const target = join4(outRoot, spec.name);
  const skillMarkdown = renderSkillMarkdown(spec);
  const sidecar = renderSidecar(spec);
  const files = [
    { path: "SKILL.md", content: skillMarkdown },
    { path: "skillsforge.json", content: `${JSON.stringify(sidecar, null, 2)}
` }
  ];
  if (options.dryRun !== false && options.write !== true) {
    return { ok: true, dryRun: true, target, files, errors: [] };
  }
  if (!options.force) {
    try {
      await access3(target);
      return { ok: false, errors: [`refusing to overwrite existing skill without --force: ${target}`], files };
    } catch {
    }
  }
  const stagingRoot = `${target}.staging-${process.pid}`;
  const staging = join4(stagingRoot, spec.name);
  await rm(stagingRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
  await mkdir(staging, { recursive: true });
  for (const file of files) {
    const absolute = join4(staging, file.path);
    await mkdir(dirname3(absolute), { recursive: true });
    await writeFile(absolute, file.content);
  }
  const validation = await validateSkillPath(staging, { root: process.cwd() });
  if (validation.status !== "pass") {
    await rm(stagingRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    return { ok: false, errors: validation.errors, files };
  }
  const loaded = await loadSkill(staging);
  const findings = await scanSkill({
    ...loaded,
    files: loaded.files.filter((file) => file !== loaded.sidecarFile)
  });
  const blocking = findings.filter((item) => item.blocking);
  if (blocking.length > 0) {
    await rm(stagingRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    return { ok: false, errors: blocking.map((item) => `${item.rule}: ${item.evidence.join(", ")}`), files, findings };
  }
  await rm(target, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
  await mkdir(dirname3(target), { recursive: true });
  await rename(staging, target);
  await rm(stagingRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
  return { ok: true, dryRun: false, target, files, findings, errors: [] };
}
function renderSkillMarkdown(spec) {
  const when = (spec.whenToUse ?? []).map((item) => `- ${item}`).join("\n") || "- Use when the forge spec matches the task.";
  return `---
name: ${spec.name}
description: ${spec.description}
license: ${spec.provenance?.license ?? "MIT"}
---

# ${spec.name}

## Overview

${spec.overview}

## When to Use

${when}
`;
}
function renderSidecar(spec) {
  return {
    schemaVersion: 1,
    maturity: spec.maturity ?? "experimental",
    requires: spec.requires ?? [],
    routing: {
      triggers: spec.routing.triggers,
      antiTriggers: spec.routing.antiTriggers ?? [],
      ...spec.routing.mode ? { mode: spec.routing.mode } : {},
      ...spec.routing.pack ? { pack: spec.routing.pack } : {}
    },
    capabilities: {
      exec: {
        allowed: Boolean(spec.capabilities.exec?.allowed),
        commands: spec.capabilities.exec?.commands ?? []
      },
      network: {
        allowed: Boolean(spec.capabilities.network?.allowed),
        hosts: spec.capabilities.network?.hosts ?? []
      },
      write: {
        scope: spec.capabilities.write?.scope ?? "skill"
      }
    },
    compatibility: spec.compatibility ?? {
      "claude-code": "full",
      cursor: "partial"
    },
    provenance: spec.provenance ?? {
      source: "forge",
      license: "MIT"
    }
  };
}

// scripts/skillsforge-cli.mjs
init_receipt();

// lib/capabilities/doctor.mjs
init_verify();
import { access as access4, readFile as readFile6 } from "node:fs/promises";
import { join as join6 } from "node:path";
async function runDoctor(root = process.cwd()) {
  const checks = [];
  const repositoryPluginRoot = join6(root, "plugins", "skillsforge");
  const monorepo = await pathExists(join6(repositoryPluginRoot, ".claude-plugin", "plugin.json"));
  const installedPlugin = await pathExists(join6(root, ".claude-plugin", "plugin.json")) && await pathExists(join6(root, "skills"));
  const pluginRoot = monorepo || !installedPlugin ? repositoryPluginRoot : root;
  const manifest = join6(pluginRoot, ".claude-plugin", "plugin.json");
  const marketplace = join6(root, ".claude-plugin", "marketplace.json");
  const hooks = join6(pluginRoot, "hooks", "hooks.json");
  const binary = join6(pluginRoot, "bin", "skillsforge.mjs");
  checks.push(await fileCheck("plugin manifest", manifest));
  checks.push(monorepo ? await fileCheck("marketplace manifest", marketplace) : await optionalFileCheck("marketplace manifest", marketplace));
  checks.push(await optionalFileCheck("hooks config", hooks));
  checks.push(await optionalFileCheck("runtime CLI", binary));
  const validationRoot = monorepo ? root : pluginRoot;
  const verification = await verifyInstalledSkills(validationRoot, {
    allowEmpty: false,
    profile: "claude-code"
  });
  checks.push({
    name: "skill validation",
    ok: verification.structuralOk,
    detail: verification.structuralOk ? `passed ${verification.reports.length} skills` : verification.text.trim()
  });
  const policyFindings = verification.findings.filter((item) => isPolicyFinding(item));
  const blockingPolicy = policyFindings.filter((item) => item.blocking);
  checks.push({
    name: "capability policy",
    ok: blockingPolicy.length === 0,
    detail: blockingPolicy.length === 0 ? `scanned ${verification.policyScanned} sidecar skills` : summarizeFindings(blockingPolicy)
  });
  const graph = verification.graph;
  const graphOk = graph && graph.cycles.length === 0 && graph.missing.length === 0 && graph.duplicates.length === 0;
  checks.push({
    name: "dependency graph",
    ok: Boolean(graphOk),
    detail: graphOk ? `order=${graph.order.join(",") || "(none)"}` : JSON.stringify({
      cycles: graph?.cycles ?? [],
      missing: graph?.missing ?? [],
      duplicates: graph?.duplicates ?? []
    })
  });
  return {
    ok: checks.every((check) => check.ok),
    checks,
    findings: verification.findings
  };
}
function isPolicyFinding(item) {
  return !["dependency-cycle", "missing-dependency", "duplicate-name", "skill-load-failed"].includes(item.rule);
}
function summarizeFindings(findings) {
  return findings.map((item) => `${item.skill ?? "?"}:${item.rule}:${(item.evidence ?? []).join(",")}`).join("; ");
}
async function pathExists(path) {
  try {
    await access4(path);
    return true;
  } catch {
    return false;
  }
}
async function fileCheck(name, path) {
  try {
    await access4(path);
    const raw = await readFile6(path, "utf8");
    JSON.parse(raw);
    return { name, ok: true, detail: path };
  } catch (error) {
    return { name, ok: false, detail: error.message };
  }
}
async function optionalFileCheck(name, path) {
  try {
    await access4(path);
    return { name, ok: true, detail: path };
  } catch {
    return { name, ok: true, detail: `${path} not present` };
  }
}

// lib/capabilities/claude-policy-compiler.mjs
var import_yaml3 = __toESM(require_dist(), 1);
init_policy_shell();
import { isAbsolute as isAbsolute4, normalize, resolve as resolve6, sep as sep4 } from "node:path";
function enforcePolicy(event, policy) {
  const caps = policy?.capabilities ?? {
    exec: { allowed: false, commands: [] },
    network: { allowed: false, hosts: [] },
    write: { scope: "skill" }
  };
  const tool = event.tool_name;
  const input = event.tool_input ?? {};
  if (tool === "WebSearch") {
    if (caps.network?.allowed !== true || caps.network?.searchAllowed !== true) {
      return deny(
        caps.network?.allowed !== true ? "network capability is not declared" : "network searchAllowed is not declared"
      );
    }
  }
  if (tool === "WebFetch" && caps.network?.allowed !== true) {
    return deny("network capability is not declared");
  }
  if (tool === "WebFetch" && caps.network?.allowed === true) {
    const host = hostFromUrl(input.url);
    if (!host || !hostAllowed2(host, caps.network.hosts)) {
      return deny(`network host is not declared: ${host ?? "invalid URL"}`);
    }
  }
  if (tool === "Bash") {
    const command = String(input.command ?? "");
    if (caps.exec?.allowed !== true) return deny("exec capability is not declared");
    if (hasShellControlSyntax(command)) {
      return deny("shell command contains disallowed control syntax");
    }
    if (!commandAllowed(command, caps.exec.commands)) {
      return deny("shell command is not declared");
    }
    if (caps.network?.allowed !== true && shellImpliesNetwork(command)) {
      return deny("network capability is not declared for shell command");
    }
    if (caps.network?.allowed === true) {
      for (const url of command.match(/\b(?:https?|wss?):\/\/[^\s"'`]+/gi) ?? []) {
        const host = hostFromUrl(url);
        if (!host || !hostAllowed2(host, caps.network.hosts)) {
          return deny(`network host is not declared: ${host ?? "invalid URL"}`);
        }
      }
    }
    if ((caps.write?.scope === "skill" || caps.write?.scope === "none") && /(?:^|\s)(?:rm|del|Remove-Item)\b/i.test(command)) {
      return deny("write scope forbids destructive shell writes");
    }
    if (caps.write?.scope === "none" && (!commandExactlyAllowed(command, caps.exec.commands) || shellImpliesWrite(command))) {
      return deny("write scope forbids shell writes");
    }
  }
  if ((tool === "Write" || tool === "Edit") && caps.write) {
    const filePath = String(input.file_path ?? input.path ?? "");
    if (!filePath) {
      return deny("write path is required");
    }
    if (caps.write.scope === "none") return deny("write capability scope is none");
    if (caps.write.scope === "skill") {
      const skillRoot = policy.__skillRoot;
      const candidate = skillRoot && !isAbsolute4(filePath) ? resolve6(skillRoot, filePath) : resolve6(filePath);
      if (skillRoot && !isInside4(skillRoot, candidate)) {
        return deny("write escapes skill scope");
      }
    }
    if (caps.write.scope === "project") {
      const projectRoot = policy.__projectRoot;
      const candidate = projectRoot && !isAbsolute4(filePath) ? resolve6(projectRoot, filePath) : resolve6(filePath);
      if (projectRoot && !isInside4(projectRoot, candidate)) {
        return deny("write escapes project scope");
      }
    }
  }
  return null;
}
function deny(reason) {
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: `SkillsForge policy: ${reason}`
    }
  };
}
function isInside4(parent, candidate) {
  const normalizedParent = normalize(resolve6(parent));
  const normalizedCandidate = normalize(resolve6(candidate));
  return normalizedCandidate === normalizedParent || normalizedCandidate.startsWith(normalizedParent.endsWith(sep4) ? normalizedParent : normalizedParent + sep4);
}

// scripts/skillsforge-cli.mjs
init_dependency_graph();
init_verify();

// lib/capabilities/install.mjs
import { access as access6, mkdir as mkdir2, readFile as readFile8, writeFile as writeFile2 } from "node:fs/promises";
import { dirname as dirname4, join as join8, relative as relative6, sep as sep7 } from "node:path";

// lib/capabilities/export.mjs
var import_yaml4 = __toESM(require_dist(), 1);
init_validate_skill_lib();
import { readFile as readFile7 } from "node:fs/promises";
import { relative as relative5, sep as sep5 } from "node:path";
var CLAUDE_ONLY_FRONTMATTER_KEYS = Object.freeze([
  "hooks",
  "when_to_use",
  "argument-hint",
  "disable-model-invocation",
  "user-invocable",
  "model",
  "effort",
  "context",
  "agent",
  "paths",
  "shell",
  "disallowed-tools"
]);
function exportPortableSkill(skill) {
  const requires = Array.isArray(skill.requires) ? skill.requires : [];
  const requiresNote = requires.length ? `

## Requires
${requires.map((name) => `- ${name}`).join("\n")}` : "";
  const contents = `---
name: ${skill.name}
description: ${skill.description}
---
${String(skill.body ?? "").trim()}${requiresNote}
`;
  return {
    files: [{ path: "SKILL.md", contents }],
    interop: {
      accepted: ["name", "description", "body"],
      transformed: requires.length ? ["requires"] : [],
      ignored: ["skillsforge.json", "hooks", "routing", "capabilities", "scripts", "references", "assets"],
      runtimeEnforced: false,
      losses: ["scripts", "references", "assets", "sidecar", "claude-extensions"]
    }
  };
}
async function exportHostPackage(skill, host = {}) {
  const source = await readFile7(skill.skillFile, "utf8");
  const parsed = parseFrontmatter(source);
  if (!parsed) throw new Error(`SKILL.md frontmatter missing in ${skill.directory}`);
  const document = (0, import_yaml4.parseDocument)(parsed.yaml, { prettyErrors: true, strict: true, uniqueKeys: true });
  if (document.errors.length) {
    throw new Error(document.errors.map((error) => error.message).join("; "));
  }
  const front = document.toJS() ?? {};
  const ignored = [];
  const transformed = [];
  for (const key of CLAUDE_ONLY_FRONTMATTER_KEYS) {
    if (Object.prototype.hasOwnProperty.call(front, key)) {
      ignored.push(key);
      delete front[key];
    }
  }
  if (Array.isArray(front["allowed-tools"])) {
    ignored.push("allowed-tools(array)");
    delete front["allowed-tools"];
  }
  front.name = skill.name;
  if (typeof skill.description === "string" && skill.description) {
    front.description = skill.description;
  }
  const skillMd = `---
${(0, import_yaml4.stringify)(front).trim()}
---
${parsed.body.replace(/^\r?\n/, "")}`;
  const files = [{ path: "SKILL.md", contents: skillMd }];
  const accepted = ["name", "description", "body"];
  for (const abs of skill.files ?? []) {
    const rel = relative5(skill.directory, abs).split(sep5).join("/");
    if (!rel || rel === "SKILL.md") continue;
    if (rel.startsWith("..")) continue;
    const contents = await readFile7(abs);
    files.push({ path: rel, contents });
    if (rel === "skillsforge.json") {
      if (host.usesSidecar) accepted.push("skillsforge.json");
      else {
        transformed.push("skillsforge.json(provenance)");
      }
    } else if (rel.startsWith("scripts/") || rel.startsWith("references/") || rel.startsWith("assets/")) {
      accepted.push(rel.split("/")[0]);
    } else {
      accepted.push(rel);
    }
  }
  const uniqueAccepted = [...new Set(accepted)];
  return {
    files,
    interop: {
      accepted: uniqueAccepted,
      transformed: [...new Set(transformed)],
      ignored: [...new Set(ignored)],
      runtimeEnforced: Boolean(host.runtimeEnforced),
      losses: ignored.length ? ["claude-extensions"] : [],
      usesSidecar: Boolean(host.usesSidecar)
    }
  };
}

// lib/capabilities/install.mjs
init_hosts();
init_skill_loader();
init_verify();
async function pathExists3(path) {
  try {
    await access6(path);
    return true;
  } catch {
    return false;
  }
}
async function installSkills(options = {}) {
  const home = options.home;
  const root = options.root ?? process.cwd();
  const dryRun = Boolean(options.dryRun);
  const force = Boolean(options.force);
  let hosts = options.hosts;
  if (!hosts) {
    if (!options.hostIds?.length) {
      return {
        ok: false,
        error: "no hosts selected",
        installs: [],
        validation: null
      };
    }
    const selection = await resolveHostSelection(options.hostIds, { home });
    if (selection.unknown.length) {
      return {
        ok: false,
        error: `unknown hosts: ${selection.unknown.join(", ")}`,
        installs: [],
        validation: null,
        hosts: selection.all
      };
    }
    hosts = selection.selected;
  }
  if (!hosts.length) {
    return { ok: false, error: "no hosts selected", installs: [], validation: null };
  }
  let skills = options.skills;
  if (!skills) {
    if (options.skillPaths?.length) {
      skills = [];
      for (const path of options.skillPaths) {
        skills.push(await loadSkill(path, { root }));
      }
    } else {
      skills = await loadAllSkills(root);
    }
  }
  if (!skills.length) {
    return { ok: false, error: "no skills to install", installs: [], validation: null };
  }
  const paths = skills.map((skill) => skill.directory);
  const validation = await verifySkillPaths(paths, {
    root,
    profile: "claude-code",
    all: false,
    dependencies: false
  });
  if (!validation.ok) {
    return {
      ok: false,
      error: "validation failed",
      installs: [],
      validation,
      planned: []
    };
  }
  const installs = [];
  const planned = [];
  for (const host of hosts) {
    for (const skill of skills) {
      const targetDir = join8(host.skillsDir, skill.name);
      const exists = await pathExists3(targetDir);
      const entry = {
        host: host.id,
        skill: skill.name,
        dir: targetDir,
        fidelity: host.fidelity,
        status: "pending"
      };
      if (exists && !force) {
        entry.status = "skipped";
        entry.reason = "target exists (pass --force to overwrite)";
        installs.push(entry);
        continue;
      }
      const materialization = host.fidelity === "full" ? await exportFullClaudePackage(skill, host) : await exportHostPackage(skill, host);
      entry.interop = materialization.interop;
      for (const file of materialization.files) {
        planned.push({ host: host.id, skill: skill.name, path: join8(targetDir, file.path) });
      }
      if (!dryRun) {
        await mkdir2(targetDir, { recursive: true });
        for (const file of materialization.files) {
          const dest = join8(targetDir, file.path);
          await mkdir2(dirname4(dest), { recursive: true });
          await writeFile2(dest, file.contents);
        }
      }
      entry.status = dryRun ? "planned" : "installed";
      entry.files = materialization.files.map((file) => file.path);
      installs.push(entry);
    }
  }
  const blocked = installs.some((item) => item.status === "pending");
  return {
    ok: !blocked,
    dryRun,
    installs,
    planned,
    validation,
    hosts: await detectHosts({ home })
  };
}
async function exportFullClaudePackage(skill, host) {
  const files = [];
  for (const abs of skill.files ?? []) {
    const rel = relative6(skill.directory, abs).split(sep7).join("/");
    if (!rel || rel.startsWith("..")) continue;
    files.push({ path: rel, contents: await readFile8(abs) });
  }
  return {
    files,
    interop: {
      accepted: files.map((file) => file.path),
      transformed: [],
      ignored: [],
      runtimeEnforced: Boolean(host.runtimeEnforced),
      losses: [],
      usesSidecar: Boolean(host.usesSidecar)
    }
  };
}

// lib/capabilities/install-tui.mjs
import readline from "node:readline";
async function pickHosts(hosts, options = {}) {
  const input = options.input ?? process.stdin;
  const output = options.output ?? process.stdout;
  if (!input.isTTY || typeof input.setRawMode !== "function") {
    throw new Error("interactive picker requires a TTY; pass --hosts <ids> --yes");
  }
  const selected = new Set(hosts.filter((host) => host.detected).map((host) => host.id));
  let cursor = 0;
  let done = false;
  let aborted = false;
  function render() {
    output.write("\x1B[?25l");
    output.write("\x1B[H\x1B[J");
    output.write("Which agents should SkillsForge configure?\n\n");
    hosts.forEach((host, index) => {
      const pointer = index === cursor ? ">" : " ";
      const mark = selected.has(host.id) ? "[x]" : "[ ]";
      const note = host.detected ? "" : " (not detected)";
      const fidelity = host.fidelity === "full" ? "full" : "package";
      const dimStart = host.detected ? "" : "\x1B[2m";
      const dimEnd = host.detected ? "" : "\x1B[0m";
      output.write(`${dimStart}${pointer} ${mark} ${host.label} \u2014 ${fidelity}${note}${dimEnd}
`);
    });
    output.write("\n\u2191/\u2193 move \xB7 space toggle \xB7 enter confirm \xB7 q abort\n");
  }
  return await new Promise((resolvePromise) => {
    const rl = readline.createInterface({ input, output, terminal: true });
    readline.emitKeypressEvents(input, rl);
    input.setRawMode(true);
    render();
    function cleanup(result) {
      if (done) return;
      done = true;
      input.setRawMode(false);
      input.removeListener("keypress", onKeypress);
      rl.close();
      output.write("\x1B[?25h");
      resolvePromise(result);
    }
    function onKeypress(_str, key) {
      if (!key) return;
      if (key.ctrl && key.name === "c") {
        aborted = true;
        cleanup(null);
        return;
      }
      switch (key.name) {
        case "up":
          cursor = (cursor - 1 + hosts.length) % hosts.length;
          render();
          break;
        case "down":
          cursor = (cursor + 1) % hosts.length;
          render();
          break;
        case "space": {
          const id = hosts[cursor].id;
          if (selected.has(id)) selected.delete(id);
          else selected.add(id);
          render();
          break;
        }
        case "return":
        case "enter":
          cleanup([...selected]);
          break;
        case "q":
        case "escape":
          aborted = true;
          cleanup(null);
          break;
        default:
          break;
      }
      if (aborted) {
      }
    }
    input.on("keypress", onKeypress);
  });
}

// scripts/skillsforge-cli.mjs
init_hosts();

// lib/capabilities/codex-package.mjs
init_schema_lib();
init_schemas_generated();
init_skill_loader();
init_verify();
init_codex_policy_compiler();
import { access as access7, cp, mkdir as mkdir3, readFile as readFile9, readdir as readdir5, realpath as realpath4, rename as rename2, rm as rm2, writeFile as writeFile3 } from "node:fs/promises";
import { homedir as homedir2 } from "node:os";
import { basename as basename3, dirname as dirname5, join as join9, normalize as normalize3, relative as relative7, resolve as resolve9, sep as sep9 } from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
var MULTI_SKILL_MESSAGE = "Codex packaging rejects multi-skill inputs; package one skill at a time with --skill <skill-dir>";
async function packageCodexPlugin(options = {}) {
  const skillDir = resolve9(options.skillDir ?? "");
  const outDir = resolve9(options.outDir ?? "");
  const write = options.write === true;
  const dryRun = write ? false : options.dryRun !== false;
  const force = options.force === true;
  if (!options.skillDir || !options.outDir) {
    return {
      ok: false,
      host: "codex",
      skill: "",
      outDir,
      dryRun,
      files: [],
      interop: emptyInterop(),
      errors: ["--skill and --out are required"]
    };
  }
  const resolved = await resolveSingleSkillDir(skillDir);
  if (!resolved.ok) {
    return {
      ok: false,
      host: "codex",
      skill: "",
      outDir,
      dryRun,
      files: [],
      interop: emptyInterop(),
      errors: resolved.errors
    };
  }
  const skillRoot = resolved.skillDir;
  let skill;
  try {
    skill = await loadSkill(skillRoot);
  } catch (error) {
    return fail(skillRoot, outDir, dryRun, [`failed to load skill: ${error.message}`]);
  }
  const validation = await verifySkillPaths([skillRoot], {
    root: dirname5(skillRoot),
    all: false,
    allowEmpty: false,
    profile: "claude-code",
    dependencies: false
  });
  if (!validation.ok) {
    return fail(skill.name, outDir, dryRun, [
      "validation or policy scan blocked packaging",
      ...validation.findings.filter((item) => item.blocking).map((item) => `${item.rule}: ${(item.evidence ?? []).join(", ")}`),
      validation.text.trim()
    ].filter(Boolean), validation.findings);
  }
  const planned = await planCodexPackage(skill);
  const receipt = {
    ok: true,
    host: "codex",
    skill: skill.name,
    outDir,
    dryRun,
    force,
    files: planned.files.map((file) => ({ path: file.path, action: file.action })),
    interop: planned.interop,
    findings: validation.findings,
    notes: planned.notes,
    plugin: planned.plugin,
    errors: []
  };
  const schemaResult = await validateWithSchema(schemas["codex-package"], receipt);
  if (!schemaResult.valid) {
    return fail(skill.name, outDir, dryRun, schemaResult.errors.map((error) => `codex-package ${error}`));
  }
  if (dryRun) return receipt;
  const outputSafety = await validateCodexOutputDir(outDir, skillRoot);
  if (!outputSafety.ok) {
    return fail(skill.name, outDir, false, outputSafety.errors);
  }
  if (!force) {
    try {
      await access7(outDir);
      const entries = await readdir5(outDir);
      if (entries.length > 0) {
        return fail(skill.name, outDir, false, [`refusing to overwrite non-empty out dir without --force: ${outDir}`]);
      }
    } catch {
    }
  }
  const token = `${process.pid}-${Date.now()}`;
  const stagingRoot = `${outDir}.staging-${token}`;
  const backupRoot = `${outDir}.backup-${token}`;
  let backedUp = false;
  try {
    await rm2(stagingRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    await rm2(backupRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    await mkdir3(stagingRoot, { recursive: true });
    for (const file of planned.files) {
      const absolute = join9(stagingRoot, file.path);
      await mkdir3(dirname5(absolute), { recursive: true });
      if (file.bytes != null) {
        await writeFile3(absolute, file.bytes);
      } else if (file.from) {
        await cp(file.from, absolute, { recursive: false });
      } else {
        await writeFile3(absolute, file.contents ?? "");
      }
    }
    await writeFile3(
      join9(stagingRoot, "package-receipt.json"),
      `${JSON.stringify({ ...receipt, dryRun: false }, null, 2)}
`
    );
    await mkdir3(dirname5(outDir), { recursive: true });
    if (await pathExists4(outDir)) {
      await rename2(outDir, backupRoot);
      backedUp = true;
    }
    await rename2(stagingRoot, outDir);
    if (backedUp) {
      await rm2(backupRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
      backedUp = false;
    }
  } catch (error) {
    await rm2(stagingRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 }).catch(() => {
    });
    if (backedUp) {
      await rm2(outDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 }).catch(() => {
      });
      await rename2(backupRoot, outDir).catch(() => {
      });
    }
    return fail(skill.name, outDir, false, [`package write failed: ${error.message}`]);
  } finally {
    await rm2(stagingRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 }).catch(() => {
    });
    await rm2(backupRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 }).catch(() => {
    });
  }
  return {
    ...receipt,
    dryRun: false,
    files: [
      ...receipt.files,
      { path: "package-receipt.json", action: "write" }
    ]
  };
}
async function validateCodexOutputDir(outDir, skillRoot) {
  const candidate = await resolveRealCandidate(outDir);
  const repoRoot = await resolveRealCandidate(await findPackageSourceRoot());
  const sourceRoot = await resolveRealCandidate(skillRoot);
  const homeRoot = await resolveRealCandidate(homedir2());
  if (isFilesystemRoot(candidate)) {
    return { ok: false, errors: [`protected output directory rejected: filesystem root ${candidate}`] };
  }
  if (samePath(candidate, homeRoot) || isInsidePath(candidate, homeRoot)) {
    return { ok: false, errors: [`protected output directory rejected: home directory or ancestor ${outDir}`] };
  }
  if (samePath(candidate, repoRoot) || isInsidePath(candidate, repoRoot)) {
    return { ok: false, errors: [`protected output directory rejected: repository root or ancestor ${outDir}`] };
  }
  if (samePath(candidate, sourceRoot) || isInsidePath(candidate, sourceRoot) || isInsidePath(sourceRoot, candidate)) {
    return { ok: false, errors: [`protected output directory rejected: skill source or ancestor ${outDir}`] };
  }
  return { ok: true, errors: [] };
}
async function resolveRealCandidate(target) {
  const missing = [];
  let current = resolve9(target);
  while (true) {
    try {
      const real = await realpath4(current);
      return normalize3(resolve9(real, ...missing.reverse()));
    } catch {
      const parent = dirname5(current);
      if (parent === current) return normalize3(resolve9(target));
      missing.push(basename3(current));
      current = parent;
    }
  }
}
function isFilesystemRoot(path) {
  return dirname5(path) === path;
}
function samePath(left, right) {
  return normalize3(resolve9(left)).toLowerCase() === normalize3(resolve9(right)).toLowerCase();
}
function isInsidePath(parent, candidate) {
  const normalizedParent = normalize3(resolve9(parent)).toLowerCase();
  const normalizedCandidate = normalize3(resolve9(candidate)).toLowerCase();
  return normalizedCandidate.startsWith(normalizedParent.endsWith(sep9) ? normalizedParent : normalizedParent + sep9);
}
async function resolveSingleSkillDir(skillDir) {
  const abs = resolve9(skillDir);
  if (await pathExists4(join9(abs, "SKILL.md"))) {
    return { ok: true, skillDir: abs };
  }
  const nestedRoots = [];
  for (const candidate of [join9(abs, "skills"), abs]) {
    const found = await listSkillDirectories(candidate);
    nestedRoots.push(...found);
  }
  const unique = [...new Set(nestedRoots)];
  if (unique.length > 1) {
    return { ok: false, errors: [MULTI_SKILL_MESSAGE] };
  }
  if (unique.length === 1) {
    return { ok: true, skillDir: unique[0] };
  }
  return { ok: false, errors: [`skill directory not found: ${abs}`] };
}
async function listSkillDirectories(root) {
  const out = [];
  let entries = [];
  try {
    entries = await readdir5(root, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = join9(root, entry.name);
    if (await pathExists4(join9(dir, "SKILL.md"))) out.push(dir);
  }
  return out;
}
async function planCodexPackage(skill) {
  const files = [];
  const notes = [];
  const accepted = [];
  const transformed = [];
  const ignored = [];
  const losses = [];
  const plugin = {
    name: skill.name,
    version: "0.0.0",
    description: skill.description || `Guarded Codex plugin for ${skill.name}`,
    skills: "./skills/",
    interface: {
      displayName: titleCase(skill.name),
      shortDescription: truncate(skill.description || skill.name, 160)
    }
  };
  files.push({
    path: join9(".codex-plugin", "plugin.json"),
    action: "generate",
    contents: `${JSON.stringify(plugin, null, 2)}
`
  });
  accepted.push(".codex-plugin/plugin.json");
  const skillPrefix = join9("skills", skill.name);
  const skillMd = await readFile9(skill.skillFile);
  files.push({ path: join9(skillPrefix, "SKILL.md"), action: "copy", bytes: skillMd });
  accepted.push("SKILL.md");
  if (/\bhooks\s*:/i.test(skillMd.toString("utf8")) || /\bPreToolUse\b/.test(skillMd.toString("utf8"))) {
    ignored.push("Claude-only PreToolUse hooks in SKILL.md");
    losses.push("claude-skill-hooks");
    notes.push("Claude-only hooks in SKILL.md are ignored for Codex packaging; plugin-level hooks enforce policy.");
  }
  if (skill.sidecarFile) {
    const sidecarBytes = await readFile9(skill.sidecarFile);
    files.push({ path: join9(skillPrefix, "skillsforge.json"), action: "copy", bytes: sidecarBytes });
    files.push({ path: join9("policy", "skillsforge.json"), action: "copy", bytes: sidecarBytes });
    accepted.push("skillsforge.json");
    accepted.push("policy/skillsforge.json");
  } else {
    const denyAll = {
      schemaVersion: 1,
      routing: { triggers: [skill.name], antiTriggers: [] },
      capabilities: {
        exec: { allowed: false, commands: [] },
        network: { allowed: false, hosts: [] },
        write: { scope: "none" },
        mcp: { allowed: false, tools: [] }
      }
    };
    const contents = `${JSON.stringify(denyAll, null, 2)}
`;
    files.push({ path: join9(skillPrefix, "skillsforge.json"), action: "generate", contents });
    files.push({ path: join9("policy", "skillsforge.json"), action: "generate", contents });
    transformed.push("skillsforge.json(deny-all-generated)");
    notes.push("No sidecar present; generated deny-all policy for guarded Codex packaging.");
  }
  const openaiPath = join9(skill.directory, "agents", "openai.yaml");
  if (await pathExists4(openaiPath)) {
    files.push({
      path: join9(skillPrefix, "agents", "openai.yaml"),
      action: "copy",
      bytes: await readFile9(openaiPath)
    });
    accepted.push("agents/openai.yaml");
  } else {
    files.push({
      path: join9(skillPrefix, "agents", "openai.yaml"),
      action: "generate",
      contents: renderOpenAiYaml(skill)
    });
    transformed.push("agents/openai.yaml(generated-from-frontmatter)");
    accepted.push("agents/openai.yaml");
  }
  for (const resource of ["scripts", "references", "assets"]) {
    const resourceDir = join9(skill.directory, resource);
    if (!await pathExists4(resourceDir)) continue;
    const resourceFiles = await listFilesRecursive(resourceDir);
    for (const file of resourceFiles) {
      const rel = relative7(skill.directory, file).split(sep9).join("/");
      files.push({
        path: join9(skillPrefix, ...rel.split("/")),
        action: "copy",
        bytes: await readFile9(file)
      });
    }
    accepted.push(resource);
  }
  const hooks = compileCodexHooks({ policyRelativePath: "policy/skillsforge.json" });
  files.push({
    path: join9("hooks", "hooks.json"),
    action: "generate",
    contents: `${JSON.stringify(hooks, null, 2)}
`
  });
  accepted.push("hooks/hooks.json");
  const repoRoot = await findPackageSourceRoot();
  const hookSource = join9(repoRoot, "plugins", "skillsforge", "hooks", "codex-pre-tool-policy.mjs");
  files.push({
    path: join9("hooks", "codex-pre-tool-policy.mjs"),
    action: "copy",
    bytes: await readFile9(hookSource)
  });
  files.push({
    path: join9("hooks", "codex-policy-compiler.mjs"),
    action: "copy",
    bytes: await readFile9(join9(repoRoot, "lib", "capabilities", "codex-policy-compiler.mjs")).then((buf) => Buffer.from(buf.toString("utf8").replaceAll("from './policy-shell.mjs'", "from './policy-shell.mjs'")))
  });
  files.push({
    path: join9("hooks", "policy-shell.mjs"),
    action: "copy",
    bytes: await readFile9(join9(repoRoot, "lib", "capabilities", "policy-shell.mjs"))
  });
  accepted.push("hooks/codex-pre-tool-policy.mjs");
  return {
    files,
    notes,
    plugin,
    interop: {
      accepted: [...new Set(accepted)],
      transformed: [...new Set(transformed)],
      ignored: [...new Set(ignored)],
      runtimeEnforced: true,
      usesSidecar: false,
      losses: [...new Set(losses)]
    }
  };
}
function renderOpenAiYaml(skill) {
  const display = titleCase(skill.name);
  const short = truncate(skill.description || `Use the ${skill.name} skill.`, 240);
  const prompt = `Use this skill when: ${short}`;
  const allowImplicitInvocation = skill.sidecar?.routing?.mode === "auto";
  return `interface:
  display_name: ${yamlScalar(display)}
  short_description: ${yamlScalar(short)}
  default_prompt: ${yamlScalar(prompt)}
policy:
  allow_implicit_invocation: ${allowImplicitInvocation ? "true" : "false"}
`;
}
function yamlScalar(value) {
  const text = String(value ?? "");
  if (/[:#{}[\],&*?|>!%@`]/.test(text) || text.includes("\n") || text.includes("'") || text.includes('"')) {
    return JSON.stringify(text);
  }
  return text;
}
function titleCase(name) {
  return String(name).split(/[-_]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
function truncate(value, max) {
  const text = String(value ?? "");
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}\u2026`;
}
async function findPackageSourceRoot() {
  const here = dirname5(fileURLToPath2(import.meta.url));
  const candidates = [
    resolve9(here, "../.."),
    // source: lib/capabilities → repo
    resolve9(here, "../../.."),
    // bundle: plugins/skillsforge/bin → repo
    resolve9(here, "../../../.."),
    // defensive
    process.cwd()
  ];
  for (const root of candidates) {
    const marker = join9(root, "plugins", "skillsforge", "hooks", "codex-pre-tool-policy.mjs");
    if (await pathExists4(marker)) return root;
  }
  throw new Error("cannot locate SkillsForge repo root (missing plugins/skillsforge/hooks/codex-pre-tool-policy.mjs)");
}
function emptyInterop() {
  return {
    accepted: [],
    transformed: [],
    ignored: [],
    runtimeEnforced: true,
    usesSidecar: false,
    losses: []
  };
}
function fail(skill, outDir, dryRun, errors, findings = []) {
  return {
    ok: false,
    host: "codex",
    skill: typeof skill === "string" ? basename3(skill) : String(skill ?? ""),
    outDir,
    dryRun,
    files: [],
    interop: emptyInterop(),
    findings,
    errors
  };
}
async function pathExists4(path) {
  try {
    await access7(path);
    return true;
  } catch {
    return false;
  }
}
async function listFilesRecursive(rootDir) {
  const out = [];
  async function walk(current) {
    const entries = await readdir5(current, { withFileTypes: true });
    for (const entry of entries) {
      const abs = join9(current, entry.name);
      if (entry.isDirectory()) await walk(abs);
      else out.push(abs);
    }
  }
  await walk(rootDir);
  return out;
}

// scripts/skillsforge-cli.mjs
init_catalog();

// lib/capabilities/vibe.mjs
init_catalog();
import { mkdir as mkdir4, writeFile as writeFile4, access as access8 } from "node:fs/promises";
import { join as join12 } from "node:path";

// lib/capabilities/quality.mjs
init_skill_loader();
init_policy();
import { readFile as readFile11 } from "node:fs/promises";
import { join as join11 } from "node:path";
var WORKFLOW_SUMMARY_RE = /\b(then|first|step\s+\d|dispatch|run the|follows? these steps)\b/i;
async function scoreSkillQuality(skillDir, options = {}) {
  const loaded = await loadSkill(skillDir, options);
  const checks = [];
  let score = 0;
  const nameOk = loaded.name && loaded.directory.endsWith(loaded.name);
  score += nameOk ? 20 : 0;
  checks.push({ id: "frontmatter", points: nameOk ? 20 : 0, max: 20, ok: nameOk });
  const sidecarOk = Boolean(loaded.sidecar);
  const caps = loaded.sidecar?.capabilities;
  const leastPrivilege = sidecarOk && caps && (caps.exec?.allowed !== true || Array.isArray(caps.exec?.commands)) && caps.write?.scope != null;
  const sidecarPoints = sidecarOk && leastPrivilege ? 20 : sidecarOk ? 10 : 0;
  score += sidecarPoints;
  checks.push({ id: "sidecar", points: sidecarPoints, max: 20, ok: sidecarPoints === 20 });
  const triggers = loaded.sidecar?.routing?.triggers ?? [];
  const anti = loaded.sidecar?.routing?.antiTriggers ?? [];
  const multiWord = triggers.filter((t) => t.trim().includes(" ")).length;
  const triggerOk = multiWord >= 4 && anti.length >= 1;
  const triggerPoints = triggerOk ? 15 : multiWord >= 2 ? 8 : 0;
  score += triggerPoints;
  checks.push({ id: "triggers", points: triggerPoints, max: 15, ok: triggerOk });
  const body = loaded.body ?? "";
  const sections = ["## Purpose", "## Phases", "## Exit", "## Anti-patterns", "## Handoff"];
  const sectionHits = sections.filter((s) => body.includes(s) || body.toLowerCase().includes(s.toLowerCase())).length;
  const altHits = ["## Overview", "## When to Use", "## Common Mistakes", "## Quick Reference"].filter((s) => body.includes(s)).length;
  const bodyOk = sectionHits >= 4 || altHits >= 3 && body.trim().length > 200;
  const bodyPoints = bodyOk ? 15 : sectionHits + altHits >= 2 ? 7 : 0;
  score += bodyPoints;
  checks.push({ id: "body", points: bodyPoints, max: 15, ok: bodyOk });
  let openaiOk = false;
  try {
    await readFile11(join11(loaded.directory, "agents", "openai.yaml"), "utf8");
    openaiOk = true;
  } catch {
    openaiOk = false;
  }
  score += openaiOk ? 10 : 0;
  checks.push({ id: "openai.yaml", points: openaiOk ? 10 : 0, max: 10, ok: openaiOk });
  const lean = body.length < 12e3;
  score += lean ? 10 : 0;
  checks.push({ id: "token-budget", points: lean ? 10 : 0, max: 10, ok: lean });
  const findings = loaded.sidecar ? await scanSkill({
    ...loaded,
    files: loaded.files.filter((file) => file !== loaded.sidecarFile)
  }) : [];
  const blocking = findings.filter((f) => f.blocking);
  const policyOk = blocking.length === 0;
  score += policyOk ? 10 : 0;
  checks.push({ id: "policy", points: policyOk ? 10 : 0, max: 10, ok: policyOk });
  const description = loaded.description ?? "";
  const csoUseWhen = /^use when\b/i.test(description.trim());
  const csoNoWorkflow = !WORKFLOW_SUMMARY_RE.test(description);
  const csoOk = csoUseWhen && csoNoWorkflow && description.length <= 500;
  checks.push({
    id: "cso",
    points: 0,
    max: 0,
    ok: csoOk,
    detail: csoOk ? "ok" : "description should start with Use when\u2026 and omit workflow summary"
  });
  return {
    name: loaded.name,
    score,
    max: 100,
    pass: score >= (options.threshold ?? 70),
    heroPass: score >= 85,
    csoOk,
    checks,
    blocking: blocking.map((f) => f.rule)
  };
}
async function lintSkill(skillDir, options = {}) {
  const result = await scoreSkillQuality(skillDir, options);
  const threshold = options.threshold ?? 70;
  const requireHero = options.hero === true;
  const ok = requireHero ? result.heroPass : result.score >= threshold;
  return { ok, threshold: requireHero ? 85 : threshold, ...result };
}

// lib/capabilities/vibe.mjs
init_skill_loader();
var ARTIFACTS = [
  "brief.md",
  "plan.md",
  "design-lock.md",
  "findings.md",
  "ship-notes.md",
  "proof.md",
  "learning.md"
];
async function runVibe(root, options = {}) {
  const workRoot = join12(root, "docs", "work");
  await mkdir4(workRoot, { recursive: true });
  const created = [];
  for (const name of ARTIFACTS) {
    const path = join12(workRoot, name);
    try {
      await access8(path);
    } catch {
      await writeFile4(path, `# ${name.replace(".md", "")}

_Stub created by \`skillsforge vibe\`. Fill this in as you work._
`);
      created.push(name);
    }
  }
  let catalogInfo = null;
  try {
    const { catalog } = await loadCatalog(root);
    catalogInfo = {
      stats: catalogStats(catalog),
      packs: listPacks(catalog).map((p) => ({ id: p.id, skills: p.skillCount })),
      profiles: listProfiles(catalog)
    };
  } catch (error) {
    catalogInfo = { error: error.message };
  }
  const skills = await loadAllSkills(root);
  const sample = skills.slice(0, 5);
  const quality = [];
  for (const skill of sample) {
    quality.push(await scoreSkillQuality(skill.directory, { root }));
  }
  const avg = quality.length ? Math.round(quality.reduce((sum, item) => sum + item.score, 0) / quality.length) : 0;
  const lines = [
    "SkillsForge vibe \u2014 magical moment",
    "",
    `Skills loaded: ${skills.length}`,
    catalogInfo.stats ? `Catalog: ${catalogInfo.stats.skills} skills across ${catalogInfo.stats.packs} packs (${catalogInfo.stats.profiles} profiles)` : `Catalog: unavailable (${catalogInfo.error})`,
    `Work artifacts: docs/work/ (${created.length ? `created ${created.join(", ")}` : "already present"})`,
    `Sample quality avg (first ${quality.length} skills): ${avg}/100`,
    "",
    "Next:",
    "  skillsforge catalog --pack eng",
    "  skillsforge quality --skill plugins/skillsforge/skills/using-skillsforge",
    '  skillsforge route --query "validate this skill"',
    ""
  ];
  if (options.json) {
    return {
      ok: true,
      text: lines.join("\n"),
      data: { skills: skills.length, catalog: catalogInfo, created, quality, avg }
    };
  }
  return { ok: true, text: lines.join("\n"), data: { skills: skills.length, catalog: catalogInfo, created, quality, avg } };
}

// lib/capabilities/scaffold.mjs
import { mkdir as mkdir5, writeFile as writeFile5, access as access9 } from "node:fs/promises";
import { join as join13, resolve as resolve12 } from "node:path";

// lib/capabilities/paths.mjs
import { isAbsolute as isAbsolute6, relative as relative8, resolve as resolve11, sep as sep10 } from "node:path";
var SKILL_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function assertSkillId(name) {
  if (typeof name !== "string" || !SKILL_ID_RE.test(name)) {
    throw new Error(`invalid skill id "${name}": must match ${SKILL_ID_RE}`);
  }
  return name;
}
function isInside6(root, candidate) {
  const parent = resolve11(root);
  const child = resolve11(candidate);
  if (parent === child) return true;
  const rel = relative8(parent, child);
  return rel !== "" && !rel.startsWith(`..${sep10}`) && rel !== ".." && !isAbsolute6(rel);
}
function resolveUnderRoot(root, userPath, options = {}) {
  if (userPath == null || userPath === "") {
    throw new Error("path is required");
  }
  const raw = String(userPath);
  if (raw.includes("\0")) {
    throw new Error("path contains NUL");
  }
  const base = resolve11(root);
  const target = isAbsolute6(raw) ? resolve11(raw) : resolve11(base, raw);
  const inside = isInside6(base, target) || target === base;
  if (!inside) {
    if (isAbsolute6(raw) && !options.allowAbsolute) {
      throw new Error(`absolute path rejected (pass --allow-absolute to override): ${raw}`);
    }
    if (!options.allowAbsolute) {
      throw new Error(`path escapes repository root: ${raw}`);
    }
  }
  return target;
}

// lib/capabilities/scaffold.mjs
function titleCase2(id) {
  return id.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
function buildScaffoldFiles(spec) {
  const name = spec.name;
  const pack = spec.pack ?? "eng";
  const mode = spec.mode ?? "explicit";
  const description = spec.description ?? `Use when you need ${name.replace(/-/g, " ")} guidance in a SkillsForge workflow.`;
  const triggers = spec.triggers ?? [
    name.replace(/-/g, " "),
    `run ${name.replace(/-/g, " ")}`,
    `${name.replace(/-/g, " ")} skill`,
    `help with ${name.replace(/-/g, " ")}`
  ];
  const antiTriggers = spec.antiTriggers ?? ["unrelated coding task", "install skillsforge"];
  const writeScope = spec.write ?? "project";
  const title = titleCase2(name);
  const allowImplicitInvocation = mode !== "explicit";
  const skillMd = `---
name: ${name}
description: ${description}
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "\${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "\${CLAUDE_PLUGIN_ROOT}/skills/${name}/skillsforge.json"
---

# ${title}

## Overview

${spec.overview ?? `Lean SkillsForge scaffold for ${title}. Use it as a routed starting point; extend with domain-specific examples, edge cases, and verification before claiming production depth.`}

## Purpose

Deliver a trustworthy, repeatable outcome for ${title} without copying third-party skill bodies or overstating this scaffold's depth.

## When to Use

- ${description}
${(spec.whenToUse ?? []).map((item) => `- ${item}`).join("\n")}

## Phases

1. Clarify the goal and constraints.
2. Gather evidence from the repo or user.
3. Produce the artifact under docs/work/ or the stated path.
4. Verify against the exit criteria below.

## Exit

- Concrete artifact written (or explicit skip with reason)
- Risks and open questions listed
- Next SkillsForge skill or CLI command recommended

## Anti-patterns

- Skipping verification
- Inventing credentials or Session IDs
- Copying third-party SKILL.md text

## Handoff

Recommend \`skillsforge route --pack ${pack}\` or the next lifecycle skill. Capture learnings with \`skillsforge capture\`.

## Common Mistakes

- Vague triggers that collide with other packs
- Workflow summaries inside the description field (breaks CSO)

## Pressure stub

See \`pressure/\` fixtures when this is a discipline skill.
`;
  const sidecar = {
    schemaVersion: 1,
    maturity: spec.maturity ?? "experimental",
    requires: spec.requires ?? [],
    routing: {
      triggers,
      antiTriggers,
      mode,
      pack
    },
    capabilities: {
      exec: { allowed: false, commands: [] },
      network: { allowed: false, hosts: [] },
      write: { scope: writeScope }
    },
    compatibility: {
      "claude-code": "full",
      cursor: "partial",
      codex: "full"
    },
    provenance: {
      source: "original",
      license: "MIT"
    }
  };
  const openai = `interface:
  display_name: ${title}
  short_description: ${description.replace(/\n/g, " ").slice(0, 200)}
  default_prompt: Use the ${name} skill for this task.
policy:
  allow_implicit_invocation: ${allowImplicitInvocation ? "true" : "false"}
`;
  return {
    "SKILL.md": skillMd,
    "skillsforge.json": `${JSON.stringify(sidecar, null, 2)}
`,
    "agents/openai.yaml": openai
  };
}
async function scaffoldSkill(root, spec, options = {}) {
  let name;
  try {
    name = assertSkillId(spec.name);
  } catch (error) {
    return { ok: false, error: error.message, target: null };
  }
  const repoRoot = resolve12(root);
  const defaultOut = join13(repoRoot, "plugins", "skillsforge", "skills");
  const outRoot = resolve12(options.outRoot ?? defaultOut);
  if (!isInside6(repoRoot, outRoot) && outRoot !== repoRoot) {
    return { ok: false, error: `outRoot escapes repository root: ${outRoot}`, target: null };
  }
  const target = join13(outRoot, name);
  if (!isInside6(repoRoot, target)) {
    return { ok: false, error: `refusing to write outside repository root: ${target}`, target };
  }
  if (!options.force) {
    try {
      await access9(target);
      return { ok: false, error: `refusing to overwrite existing skill without force: ${target}`, target };
    } catch {
    }
  }
  const files = buildScaffoldFiles({ ...spec, name });
  if (options.dryRun) {
    return { ok: true, dryRun: true, target, files };
  }
  await mkdir5(join13(target, "agents"), { recursive: true });
  for (const [rel, content] of Object.entries(files)) {
    const abs = join13(target, rel);
    if (!isInside6(target, abs) && abs !== join13(target, "")) {
      if (!isInside6(target, abs)) {
        return { ok: false, error: `refusing nested escape: ${rel}`, target };
      }
    }
    await writeFile5(abs, content);
  }
  return { ok: true, dryRun: false, target, files: Object.keys(files) };
}

// lib/capabilities/bench.mjs
init_skill_loader();
init_router();
init_validate_skill_lib();
import { mkdir as mkdir6, readFile as readFile12, readdir as readdir6, writeFile as writeFile6 } from "node:fs/promises";
import { join as join14 } from "node:path";
import { performance as performance2 } from "node:perf_hooks";
async function runBench(root, options = {}) {
  const skills = await loadAllSkills(root);
  const queries = options.queries ?? [
    "validate this agent skill",
    "what is skillsforge",
    "forge a new capability skill",
    "route this query to a skill",
    "verify capability receipt"
  ];
  const routeSamples = [];
  const t0 = performance2.now();
  for (const query of queries) {
    const start = performance2.now();
    routeQuery(query, skills, { includeExplicit: false });
    routeSamples.push(performance2.now() - start);
  }
  const validateSamples = [];
  for (const skill of skills.slice(0, Math.min(10, skills.length))) {
    const start = performance2.now();
    await validateSkillPath(skill.directory, { root });
    validateSamples.push(performance2.now() - start);
  }
  const summary = {
    skills: skills.length,
    route: stats(routeSamples),
    validate: stats(validateSamples),
    totalMs: Math.round(performance2.now() - t0),
    ts: (/* @__PURE__ */ new Date()).toISOString()
  };
  const outDir = join14(root, "artifacts", "bench");
  await mkdir6(outDir, { recursive: true });
  const outPath = join14(outDir, "latest.json");
  await writeFile6(outPath, `${JSON.stringify(summary, null, 2)}
`);
  return { ok: true, path: outPath, summary };
}
function stats(samples) {
  if (samples.length === 0) return { count: 0, p50: 0, p95: 0, max: 0 };
  const sorted = [...samples].sort((a, b) => a - b);
  const pct = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p / 100 * sorted.length))];
  return {
    count: samples.length,
    p50: Number(pct(50).toFixed(3)),
    p95: Number(pct(95).toFixed(3)),
    max: Number(sorted[sorted.length - 1].toFixed(3))
  };
}
async function runScorecard(root) {
  const skills = await loadAllSkills(root);
  let catalogPacks = {};
  try {
    const { loadCatalog: loadCatalog2, listPacks: listPacks2 } = await Promise.resolve().then(() => (init_catalog(), catalog_exports));
    const { catalog } = await loadCatalog2(root);
    for (const pack of listPacks2(catalog)) {
      catalogPacks[pack.id] = pack.skillCount;
    }
  } catch {
    catalogPacks = {};
  }
  const byPack = {};
  for (const skill of skills) {
    const pack = skill.sidecar?.routing?.pack ?? "unpacked";
    byPack[pack] = (byPack[pack] ?? 0) + 1;
  }
  let bench = null;
  try {
    bench = JSON.parse(await readFile12(join14(root, "artifacts", "bench", "latest.json"), "utf8"));
  } catch {
    bench = null;
  }
  return {
    skills: skills.length,
    byPack,
    catalogPacks,
    bench
  };
}
async function runCompose(root, workflowPath) {
  const workflow = JSON.parse(await readFile12(workflowPath, "utf8"));
  const skills = await loadAllSkills(root);
  const byName = new Map(skills.map((s) => [s.name, s]));
  const steps = workflow.steps ?? [];
  const results = [];
  for (const step of steps) {
    const skill = byName.get(step.skill);
    if (!skill) {
      results.push({ step: step.id ?? step.skill, ok: false, error: `missing skill ${step.skill}` });
      continue;
    }
    results.push({
      step: step.id ?? step.skill,
      ok: true,
      skill: skill.name,
      pack: skill.sidecar?.routing?.pack ?? null,
      note: step.note ?? "invoke skill"
    });
  }
  return { ok: results.every((r) => r.ok), workflow: workflow.name ?? "unnamed", results };
}
async function runStocktake(root) {
  const skills = await loadAllSkills(root);
  let catalogSkills = /* @__PURE__ */ new Set();
  try {
    const { loadCatalog: loadCatalog2, listPacks: listPacks2 } = await Promise.resolve().then(() => (init_catalog(), catalog_exports));
    const { catalog } = await loadCatalog2(root);
    for (const pack of listPacks2(catalog)) {
      for (const id of pack.skills) catalogSkills.add(id);
    }
  } catch {
    catalogSkills = /* @__PURE__ */ new Set();
  }
  const installed = new Set(skills.map((s) => s.name));
  const missing = [...catalogSkills].filter((id) => !installed.has(id)).sort();
  const extra = [...installed].filter((id) => catalogSkills.size && !catalogSkills.has(id)).sort();
  return {
    installed: installed.size,
    catalog: catalogSkills.size,
    missing,
    extra
  };
}
async function listPressureFixtures(skillDir) {
  const dir = join14(skillDir, "pressure");
  try {
    const entries = await readdir6(dir);
    return entries.filter((name) => name.endsWith(".json")).map((name) => join14(dir, name));
  } catch {
    return [];
  }
}
async function runPressure(skillDir, options = {}) {
  const fixtures = await listPressureFixtures(skillDir);
  if (fixtures.length === 0) {
    return { ok: options.allowMissing === true, skill: skillDir, fixtures: 0, results: [], error: "no pressure fixtures" };
  }
  const results = [];
  for (const fixturePath of fixtures) {
    const fixture = JSON.parse(await readFile12(fixturePath, "utf8"));
    const baselineViolations = fixture.baselineViolations ?? [];
    const expectedCompliance = fixture.expectedCompliance ?? [];
    const withSkillOk = expectedCompliance.length > 0;
    results.push({
      fixture: fixturePath,
      baselineFailCount: baselineViolations.length,
      complianceChecks: expectedCompliance.length,
      ok: baselineViolations.length > 0 && withSkillOk
    });
  }
  return {
    ok: results.every((r) => r.ok),
    skill: skillDir,
    fixtures: fixtures.length,
    results,
    note: "Pressure is a fixture gate (shape of baselineViolations/expectedCompliance); behavioral agent pressure is expanding."
  };
}

// lib/capabilities/skillshield.mjs
init_skill_loader();
import { readFile as readFile13 } from "node:fs/promises";
var SECRET_RE = /(api[_-]?key|secret[_-]?key|password\s*=\s*['\"][^'\"]+|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36})/i;
var UNBOUNDED_SHELL_RE = /\b(rm\s+-rf\s+\/|curl\s+[^\n]*\|\s*(ba)?sh|eval\s*\(|sudo\s+rm)\b/i;
var INJECTION_RE = /\b(ignore previous instructions|disregard system prompt|jailbreak)\b/i;
var COPY_MARKERS = [
  "obra/superpowers",
  "everything-claude-code",
  "garrytan/gstack",
  "mattpocock/skills",
  "ruvnet/ruflo",
  "addyosmani/agent-skills"
];
async function runSkillShield(skillDir, options = {}) {
  const loaded = await loadSkill(skillDir, options);
  const findings = [];
  const body = loaded.body ?? "";
  const sidecarRaw = loaded.sidecarFile ? await readFile13(loaded.sidecarFile, "utf8") : "";
  const blob = `${body}
${sidecarRaw}
${loaded.description ?? ""}`;
  if (SECRET_RE.test(blob)) {
    findings.push({ severity: "high", rule: "secret-pattern", message: "Possible secret or credential pattern in skill files" });
  }
  if (UNBOUNDED_SHELL_RE.test(blob)) {
    findings.push({ severity: "high", rule: "unbounded-shell", message: "Dangerous shell pattern detected" });
  }
  if (INJECTION_RE.test(blob)) {
    findings.push({ severity: "medium", rule: "prompt-injection", message: "Prompt-injection style language detected" });
  }
  for (const marker of COPY_MARKERS) {
    if (blob.toLowerCase().includes(marker.toLowerCase()) && !blob.includes("inspiration") && !blob.includes("complement")) {
      findings.push({
        severity: "medium",
        rule: "third-party-marker",
        message: `References ${marker} outside an inspiration/complement context`
      });
    }
  }
  const caps = loaded.sidecar?.capabilities;
  if (caps?.exec?.allowed === true && (!caps.exec.commands || caps.exec.commands.length === 0)) {
    findings.push({ severity: "high", rule: "exec-without-allowlist", message: "exec.allowed true without command allowlist" });
  }
  if (caps?.network?.allowed === true && (!caps.network.hosts || caps.network.hosts.length === 0) && !caps.network.searchAllowed) {
    findings.push({ severity: "medium", rule: "network-without-hosts", message: "network.allowed true without hosts or searchAllowed" });
  }
  if (!loaded.sidecar?.routing?.pack) {
    findings.push({ severity: "low", rule: "missing-pack", message: "routing.pack not set" });
  }
  const blocking = findings.filter((f) => f.severity === "high");
  return {
    name: loaded.name,
    ok: blocking.length === 0,
    findings,
    note: "SkillShield is a skill-body scanner (best-effort); not a full security audit."
  };
}
async function runSkillShieldMany(skillDirs, options = {}) {
  const reports = [];
  for (const dir of skillDirs) {
    reports.push(await runSkillShield(dir, options));
  }
  return {
    ok: reports.every((r) => r.ok),
    reports
  };
}

// lib/capabilities/export-agents.mjs
init_catalog();
init_skill_loader();
import { mkdir as mkdir7, readdir as readdir7, readFile as readFile14, writeFile as writeFile7 } from "node:fs/promises";
import { join as join15, resolve as resolve13 } from "node:path";
var SECRET_PATTERNS = [
  /\bsk-[A-Za-z0-9_-]{8,}\b/g,
  /\bghp_[A-Za-z0-9]{20,}\b/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
  /\bAIza[0-9A-Za-z_-]{20,}\b/g
];
function redactSecrets(text) {
  let out = String(text ?? "");
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern, "[REDACTED]");
  }
  return out;
}
async function exportAgentsMd(root, options = {}) {
  const repoRoot = resolve13(root);
  let outPath;
  try {
    outPath = options.out ? resolveUnderRoot(repoRoot, options.out, { allowAbsolute: options.allowAbsolute === true }) : join15(repoRoot, "AGENTS.md");
  } catch (error) {
    return { ok: false, error: error.message, path: null };
  }
  if (!isInside6(repoRoot, outPath) && outPath !== join15(repoRoot, "AGENTS.md")) {
    if (!options.allowAbsolute) {
      return { ok: false, error: `out path escapes repository root: ${outPath}`, path: null };
    }
  }
  let catalogSection = "";
  try {
    const { catalog } = await loadCatalog(root);
    const stats2 = catalogStats(catalog);
    const packs = listPacks(catalog);
    const profiles = listProfiles(catalog);
    catalogSection = [
      `SkillsForge catalog: **${stats2.skills}** catalog entries, **${stats2.packs}** packs, **${stats2.profiles}** profiles.`,
      "",
      "Hero depth: trust spine + lifecycle + methodology skills are production-depth; domain packs are lean scaffolds.",
      "",
      "### Profiles",
      ...profiles.map((p) => `- \`${p.id}\`: ${p.description} (packs: ${p.packs.join(", ")})`),
      "",
      "### Packs",
      ...packs.map((p) => `- \`${p.id}\` (${p.skillCount}): ${p.description}`)
    ].join("\n");
  } catch (error) {
    catalogSection = `Catalog unavailable: ${error.message}`;
  }
  const skills = await loadAllSkills(root);
  const agentsDir = join15(root, "plugins", "skillsforge", "agents");
  let agents = [];
  try {
    agents = (await readdir7(agentsDir)).filter((name) => name.endsWith(".md"));
  } catch {
    agents = [];
  }
  const content = `# AGENTS.md

Generated by \`skillsforge export-agents\`. Cross-harness context for Claude Code, Cursor, Codex, and OpenCode.

## SkillsForge

Use SkillsForge as the trust and routing layer for Agent Skills.

- Magical moment: \`npx skillsforge vibe\`
- Judge demo: \`npx skillsforge demo\`
- Validate: \`skillsforge validate --all\`
- Route: \`skillsforge route --query "..."\` or \`--pack <id>\`
- Quality: \`skillsforge quality --skill <dir>\`
- Evidence: \`skillsforge evidence --out artifacts/evidence\`

## Catalog

${catalogSection}

## Installed skills (sample)

${skills.slice(0, 40).map((s) => `- \`${s.name}\` \u2014 ${(s.description ?? "").slice(0, 120)}`).join("\n")}
${skills.length > 40 ? `
\u2026 and ${skills.length - 40} more.
` : "\n"}

## Agents

${agents.length ? agents.map((name) => `- \`plugins/skillsforge/agents/${name}\``).join("\n") : "_No agent defs yet._"}

## Complementary tools

- Use Ruflo for multi-agent swarm orchestration if needed; SkillsForge does not clone swarm/MCP consensus.
- Use SkillsForge for validate, forge, route, policy, package, and evidence.

## Skill routing (short)

When the request matches a SkillsForge skill, invoke it. Prefer pack-scoped routing for domain skills (\`routing.mode: explicit\`).
`;
  if (!options.dryRun) {
    await writeFile7(outPath, content);
  }
  return { ok: true, path: outPath, skills: skills.length, agents: agents.length, dryRun: Boolean(options.dryRun) };
}
async function captureLearning(root, entry) {
  const repoRoot = resolve13(root);
  const outDir = join15(repoRoot, "artifacts", "capture");
  if (!isInside6(repoRoot, outDir)) {
    return { ok: false, error: "capture directory escapes repository root" };
  }
  await mkdir7(outDir, { recursive: true });
  const redacted = {
    ts: (/* @__PURE__ */ new Date()).toISOString(),
    ...entry,
    insight: entry.insight != null ? redactSecrets(entry.insight) : void 0,
    summary: entry.summary != null ? redactSecrets(entry.summary) : void 0,
    key: entry.key != null ? redactSecrets(String(entry.key)) : void 0
  };
  const line = JSON.stringify(redacted);
  const path = join15(outDir, "learnings.jsonl");
  let existing = "";
  try {
    existing = await readFile14(path, "utf8");
  } catch {
    existing = "";
  }
  await writeFile7(path, `${existing}${line}
`);
  const learningMd = join15(repoRoot, "docs", "work", "learning.md");
  if (!isInside6(repoRoot, learningMd)) {
    return { ok: false, error: "learning.md path escapes repository root" };
  }
  await mkdir7(join15(repoRoot, "docs", "work"), { recursive: true });
  let md = "";
  try {
    md = await readFile14(learningMd, "utf8");
  } catch {
    md = "# learning\n\n";
  }
  md += `
- ${redacted.insight ?? redacted.summary ?? JSON.stringify(redacted)}
`;
  await writeFile7(learningMd, md);
  return { ok: true, path, learningMd };
}
async function forgeFromCapture(root, options = {}) {
  const path = join15(resolve13(root), "artifacts", "capture", "learnings.jsonl");
  let raw = "";
  try {
    raw = await readFile14(path, "utf8");
  } catch {
    return { ok: false, error: "no capture file" };
  }
  const lines = raw.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const counts = /* @__PURE__ */ new Map();
  for (const row of lines) {
    const key = (row.key ?? row.insight ?? row.summary ?? "").toString().slice(0, 80);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const candidates = [...counts.entries()].filter(([, n]) => n >= (options.minCount ?? 2)).sort((a, b) => b[1] - a[1]).slice(0, options.limit ?? 5).map(([key, count]) => ({
    key,
    count,
    suggestedName: key.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "captured-skill",
    note: "Human must approve before forge --write"
  }));
  return { ok: true, candidates };
}

// scripts/skillsforge-cli.mjs
init_skill_loader();

// lib/capabilities/demo.mjs
init_verify();
import { access as access10, cp as cp2, mkdir as mkdir8, mkdtemp, writeFile as writeFile8 } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join as join16, resolve as resolve14 } from "node:path";
init_receipt();
init_skill_loader();
async function pathExists5(path) {
  try {
    await access10(path);
    return true;
  } catch {
    return false;
  }
}
async function runJudgeDemo(root, options = {}) {
  const repo = resolve14(root);
  const started = Date.now();
  const steps = [];
  const unsafeSrc = join16(repo, "examples", "codex-unsafe-release");
  const safeSrc = join16(repo, "examples", "codex-safe-release");
  if (!await pathExists5(unsafeSrc) || !await pathExists5(safeSrc)) {
    return {
      ok: false,
      error: "missing examples/codex-unsafe-release or examples/codex-safe-release",
      elapsedMs: Date.now() - started,
      steps
    };
  }
  const work = await mkdtemp(join16(tmpdir(), "sf-judge-"));
  try {
    const unsafeDir = join16(work, "codex-unsafe-release");
    await cp2(unsafeSrc, unsafeDir, { recursive: true });
    const unsafe = await verifySkillPaths([unsafeDir], {
      root: work,
      profile: "claude-code"
    });
    const unsafeDenied = unsafe.ok === false;
    steps.push({
      id: "unsafe-validate",
      ok: unsafeDenied,
      detail: unsafeDenied ? "denied as expected" : "unexpected pass"
    });
    if (!unsafeDenied) {
      const elapsedMs2 = Date.now() - started;
      return {
        ok: false,
        error: "unsafe skill unexpectedly validated",
        elapsedMs: elapsedMs2,
        underBudget: elapsedMs2 < 9e4,
        falseAllow: 1,
        steps,
        scoreboard: formatScoreboard({
          unsafeDeny: false,
          safePass: false,
          packaged: false,
          falseAllow: 1,
          receiptHash: null,
          elapsedMs: elapsedMs2
        }, { color: options.color !== false })
      };
    }
    const safeDir = join16(work, "codex-safe-release");
    await cp2(safeSrc, safeDir, { recursive: true });
    const safe = await verifySkillPaths([safeDir], {
      root: work,
      profile: "claude-code"
    });
    steps.push({
      id: "safe-validate",
      ok: safe.ok === true,
      detail: safe.ok ? "pass" : "safe skill failed validation"
    });
    if (!safe.ok) {
      return fail2(steps, started, "safe skill failed validation", options);
    }
    const outDir = join16(work, "packaged");
    const packaged = await packageCodexPlugin({
      skillDir: safeDir,
      outDir,
      write: true,
      force: true
    });
    const packageOk = packaged.ok === true;
    steps.push({
      id: "safe-package",
      ok: packageOk,
      detail: packageOk ? outDir : (packaged.errors ?? []).join("; ")
    });
    if (!packageOk) {
      return fail2(steps, started, (packaged.errors ?? ["package failed"]).join("; "), options);
    }
    const tree = await hashPackageTree(outDir);
    const digest = tree.packageHash;
    const evidenceDir = join16(repo, "artifacts", "demo-evidence");
    await mkdir8(evidenceDir, { recursive: true });
    const evidencePath = join16(evidenceDir, "trust-receipt.json");
    let skillMeta = null;
    try {
      skillMeta = await loadSkill(safeDir);
    } catch {
      skillMeta = { name: "codex-safe-release" };
    }
    await writeFile8(evidencePath, `${JSON.stringify({
      schemaVersion: 1,
      kind: "skillsforge-judge-demo",
      skill: skillMeta.name,
      packageSha256: digest,
      files: tree.files.length,
      falseAllow: 0,
      ts: (/* @__PURE__ */ new Date()).toISOString()
    }, null, 2)}
`);
    steps.push({
      id: "evidence-receipt",
      ok: true,
      detail: digest,
      path: evidencePath
    });
    const elapsedMs = Date.now() - started;
    const underBudget = elapsedMs < 9e4;
    const board = {
      unsafeDeny: true,
      safePass: true,
      packaged: true,
      falseAllow: 0,
      receiptHash: digest,
      elapsedMs
    };
    return {
      ok: underBudget,
      error: underBudget ? void 0 : `demo exceeded 90s budget (${elapsedMs}ms)`,
      elapsedMs,
      underBudget,
      falseAllow: 0,
      receiptHash: digest,
      evidencePath,
      steps,
      urls: {
        unsafeExample: "examples/codex-unsafe-release",
        safeExample: "examples/codex-safe-release",
        evidence: "artifacts/demo-evidence/trust-receipt.json",
        demoDoc: "docs/hackathon-demo.md"
      },
      scoreboard: formatScoreboard(board, { color: options.color !== false })
    };
  } finally {
    if (!options.keepWork) {
      const { rm: rm3 } = await import("node:fs/promises");
      await rm3(work, { recursive: true, force: true });
    }
  }
}
function fail2(steps, started, error, options = {}) {
  const elapsedMs = Date.now() - started;
  return {
    ok: false,
    error,
    elapsedMs,
    underBudget: elapsedMs < 9e4,
    falseAllow: 0,
    steps,
    scoreboard: formatScoreboard({
      unsafeDeny: steps.some((s) => s.id === "unsafe-validate" && s.ok),
      safePass: steps.some((s) => s.id === "safe-validate" && s.ok),
      packaged: steps.some((s) => s.id === "safe-package" && s.ok),
      falseAllow: 0,
      receiptHash: null,
      elapsedMs
    }, { color: options.color !== false })
  };
}
function formatScoreboard(board, options = {}) {
  const color = options.color !== false && process.stdout.isTTY;
  const g = (s) => color ? `\x1B[32m${s}\x1B[0m` : s;
  const r = (s) => color ? `\x1B[31m${s}\x1B[0m` : s;
  const b = (s) => color ? `\x1B[1m${s}\x1B[0m` : s;
  const lines = [
    b("SkillsForge trust scoreboard"),
    `  unsafe deny:     ${board.unsafeDeny ? g("PASS") : r("FAIL")}`,
    `  safe validate:   ${board.safePass ? g("PASS") : r("FAIL")}`,
    `  packaged:        ${board.packaged ? g("PASS") : r("FAIL")}`,
    `  false-allow:     ${board.falseAllow === 0 ? g("0") : r(String(board.falseAllow))}`,
    `  receipt hash:    ${board.receiptHash ? `${board.receiptHash.slice(0, 16)}\u2026` : "n/a"}`,
    `  elapsed:         ${board.elapsedMs}ms`
  ];
  return lines.join("\n");
}
function formatPackScorecard(card, options = {}) {
  const color = options.color !== false && process.stdout.isTTY;
  const b = (s) => color ? `\x1B[1m${s}\x1B[0m` : s;
  const g = (s) => color ? `\x1B[32m${s}\x1B[0m` : s;
  const lines = [
    b("SkillsForge pack scorecard"),
    `  catalog entries: ${card.skills}`,
    `  packs:           ${Object.keys(card.byPack ?? {}).length}`,
    ...Object.entries(card.byPack ?? {}).sort((a, b2) => b2[1] - a[1] || a[0].localeCompare(b2[0])).slice(0, 12).map(([pack, n]) => `    ${pack.padEnd(18)} ${g(String(n))}`),
    card.bench ? `  route p50/p95:   ${card.bench.route?.p50 ?? "?"} / ${card.bench.route?.p95 ?? "?"} ms` : "  bench:           (run skillsforge bench)"
  ];
  return lines.join("\n");
}
async function compareSkillTrust(root, leftDir, rightDir) {
  const left = await loadSkill(leftDir, { root });
  const right = await loadSkill(rightDir, { root });
  const leftHas = Boolean(left.sidecar);
  const rightHas = Boolean(right.sidecar);
  let leftPolicy = null;
  let rightPolicy = null;
  try {
    leftPolicy = await verifySkillPaths([left.directory], { root, profile: "claude-code" });
  } catch (error) {
    leftPolicy = { ok: false, error: error.message };
  }
  try {
    rightPolicy = await verifySkillPaths([right.directory], { root, profile: "claude-code" });
  } catch (error) {
    rightPolicy = { ok: false, error: error.message };
  }
  return {
    left: {
      name: left.name,
      hasSidecar: leftHas,
      capabilities: left.sidecar?.capabilities ?? null,
      routing: left.sidecar?.routing ?? null,
      policyOk: leftPolicy?.ok ?? false,
      policyFindings: (leftPolicy?.findings ?? []).filter((f) => f.blocking).map((f) => f.rule)
    },
    right: {
      name: right.name,
      hasSidecar: rightHas,
      capabilities: right.sidecar?.capabilities ?? null,
      routing: right.sidecar?.routing ?? null,
      policyOk: rightPolicy?.ok ?? false,
      policyFindings: (rightPolicy?.findings ?? []).filter((f) => f.blocking).map((f) => f.rule)
    },
    delta: {
      sidecarAdvantage: leftHas !== rightHas ? rightHas ? "right has SkillsForge sidecar" : "left has SkillsForge sidecar" : "both same sidecar presence",
      policyDelta: leftPolicy?.ok === true !== (rightPolicy?.ok === true) ? `left.ok=${leftPolicy?.ok} right.ok=${rightPolicy?.ok}` : "same policy outcome"
    }
  };
}

// scripts/skillsforge-cli.mjs
var modulePath2 = fileURLToPath5(import.meta.url);
var modulePluginRoot = resolve17(dirname8(modulePath2), "..");
async function pathExists7(path) {
  try {
    await access12(path);
    return true;
  } catch {
    return false;
  }
}
async function isPluginRoot(root) {
  return await pathExists7(join19(root, ".claude-plugin", "plugin.json")) && await pathExists7(join19(root, "skills"));
}
async function isRepositoryRoot(root) {
  return pathExists7(join19(root, "plugins", "skillsforge", ".claude-plugin", "plugin.json"));
}
async function resolveRuntimeRoot(options, { explicitPaths = false } = {}) {
  if (options.root) return options.root;
  if (explicitPaths) return process.cwd();
  const cwd = process.cwd();
  if (await isRepositoryRoot(cwd)) return cwd;
  if (await isPluginRoot(modulePluginRoot)) return modulePluginRoot;
  if (await isPluginRoot(cwd)) return cwd;
  return cwd;
}
async function main(argv = process.argv.slice(2), options = {}) {
  const command = argv[0];
  if (!command || command === "help" || command === "--help") {
    process.stdout.write(`usage: skillsforge <command> [options]

Commands:
  help                              Show this help
  validate [paths...]               Validate skills (structure + capability policy when sidecar present)
    --json                          Machine-readable diagnostics
    --all                           Scan every production skill under plugins/*/skills
    --allow-empty                   Allow empty production skill libraries
    --profile <canonical|claude-code>
                                    Validation profile (default: canonical)
  doctor                            Plugin and installed-skill health checks
    --json                          Machine-readable diagnostics
  route --query <text>              Explainable skill routing for a query
  forge --spec <file>               Deterministic skill generation from forge-spec
    --dry-run                       Plan only (default when --write omitted)
    --write                         Write SKILL.md + skillsforge.json
    --force                         Overwrite an existing skill directory
    --out <dir>                     Output skills root (default: plugin skills/)
  receipt                           Build a trust receipt for packaged bytes
    --out <file>                    Receipt path (default: dist/trust-receipt.json)
    --package <dir>                 Package root to hash
    --evaluation <file>             Routing evaluation report to embed
    --require-evaluation            Fail if evaluation evidence is missing
  verify-receipt <file>             Verify a trust receipt
    --package <dir>                 Package root to re-hash
    --evaluation <file>             External routing-report.json to check
    --package-only                  Skip evaluation authenticity checks
  enforce --policy <sidecar.json>   Decide PreToolUse allow/deny from stdin event JSON
  eval                              Run holdout routing evaluation (P/R gate)
  hosts [--json] [--home <dir>]     List universal AI CLI host targets and trust boundaries
  install [skill-paths...]          Install skills into detected agent hosts
    --hosts <ids>                   Comma list or all|detected: claude-code,cursor,codex,opencode,zcode,hermes,gemini
    --custom-host <id>:<skills-dir> Add package-fidelity target under --home
    --yes                           Non-interactive (requires --hosts or --custom-host)
    --list                          Print detected hosts and exit
    --dry-run                       Plan installs without writing
    --force                         Overwrite existing skill directories
    --json                          Machine-readable output
    --home <dir>                    Override home directory (tests / custom roots)
  package --host codex              Package one skill as a guarded Codex plugin
    --skill <dir>                   Single skill directory (multi-skill inputs are rejected)
    --out <dir>                     Output plugin directory
    --dry-run                       Plan only (default when --write omitted)
    --write                         Write the Codex plugin tree
    --force                         Overwrite a non-empty --out directory
  evidence --out <dir>              Emit deterministic trust/eval evidence bundle
                                    (writes when --out is set; default CI path: artifacts/evidence)
  vibe                              Magical moment: work stubs + catalog summary + quality sample
    --json                          Machine-readable output
  catalog                           List packs/profiles/skills
    --pack <id>                     Filter by pack
    --profile <id>                  List skills for profile
    --search <text>                 Search skill ids
    --json                          Machine-readable output
  quality --skill <dir>             Score skill quality 0-100
    --json
  lint-skill --skill <dir>          Fail if quality below threshold
    --threshold <n>                 Default 70
    --hero                          Require \u226585
  scaffold --name <id>              Scaffold original skill + sidecar + openai.yaml
    --pack <id>                     Pack id (default eng)
    --mode auto|explicit
    --write                         Persist (default dry-run)
    --force                         Overwrite
  bench                             Measure route/validate latency \u2192 artifacts/bench/latest.json
  scorecard                         Pack coverage + last bench
  compose --workflow <file>         Run skill DAG from JSON workflow
  stocktake                         Diff installed skills vs catalog
  batch --pack <id> --action quality|validate|skillshield
  pressure --skill <dir>            Run skill pressure fixtures
  skillshield [--skill <dir>|--all] Scan skills for unsafe patterns
  export-agents [--out <file>]      Write AGENTS.md from catalog/agents
  capture --insight <text>          Append learning to artifacts/capture + docs/work/learning.md
  forge-from-capture                Propose skill candidates from repeated learnings
  compare --a <dir> --b <dir>       Diff two skill sidecars/descriptions
  compare-skill --a <dir> --b <dir> Side-by-side sidecar vs policy (trust delta)
  demo                              Judge path: unsafe deny \u2192 safe package \u2192 receipt
  watch --skill <dir>               Re-quality on interval (single pass in CI)
  os-env [--name <VAR>] [--json]     Inspect safe environment facts without dumping secrets
  os-find --name <glob> [--root <dir>] [--json]
                                    Cross-platform file finder with repo-safe defaults
  os-ports [--json]                 Best-effort listening port snapshot
  os-open <path-or-url> [--dry-run] [--json]
                                    Open target via platform launcher
  os-run [--yes|--dry-run] -- <cmd> [args...]
                                    Agent-safe command runner; dry-run unless --yes
  os-copy-path <path> [--json]      Resolve and print canonical path
  os-clean --root <dir> [--json]    Dry-run cleanup candidate inventory only

Exit codes: 0 success, 1 command failure, 2 invalid usage
`);
    return 0;
  }
  switch (command) {
    case "validate":
      return runValidate(argv.slice(1), options);
    case "doctor":
      return runDoctorCommand(argv.slice(1), options);
    case "route":
      return runRoute(argv.slice(1), options);
    case "forge":
      return runForge(argv.slice(1), options);
    case "receipt":
      return runReceipt(argv.slice(1), options);
    case "verify-receipt":
      return runVerifyReceipt(argv.slice(1), options);
    case "enforce":
      return runEnforce(argv.slice(1), options);
    case "eval":
      return runEvalCommand(argv.slice(1), options);
    case "hosts":
      return runHostsCommand(argv.slice(1), options);
    case "install":
      return runInstall(argv.slice(1), options);
    case "package":
      return runPackage(argv.slice(1), options);
    case "evidence":
      return runEvidence(argv.slice(1), options);
    case "vibe":
      return runVibeCommand(argv.slice(1), options);
    case "catalog":
      return runCatalogCommand(argv.slice(1), options);
    case "quality":
      return runQualityCommand(argv.slice(1), options);
    case "lint-skill":
      return runLintSkillCommand(argv.slice(1), options);
    case "scaffold":
      return runScaffoldCommand(argv.slice(1), options);
    case "bench":
      return runBenchCommand(argv.slice(1), options);
    case "scorecard":
      return runScorecardCommand(argv.slice(1), options);
    case "compose":
      return runComposeCommand(argv.slice(1), options);
    case "stocktake":
      return runStocktakeCommand(argv.slice(1), options);
    case "batch":
      return runBatchCommand(argv.slice(1), options);
    case "pressure":
      return runPressureCommand(argv.slice(1), options);
    case "skillshield":
      return runSkillShieldCommand(argv.slice(1), options);
    case "export-agents":
      return runExportAgentsCommand(argv.slice(1), options);
    case "capture":
      return runCaptureCommand(argv.slice(1), options);
    case "forge-from-capture":
      return runForgeFromCaptureCommand(argv.slice(1), options);
    case "compare":
      return runCompareCommand(argv.slice(1), options);
    case "compare-skill":
      return runCompareSkillCommand(argv.slice(1), options);
    case "demo":
      return runDemoCommand(argv.slice(1), options);
    case "watch":
      return runWatchCommand(argv.slice(1), options);
    case "os-env":
      return runOsEnvCommand(argv.slice(1), options);
    case "os-find":
      return runOsFindCommand(argv.slice(1), options);
    case "os-ports":
      return runOsPortsCommand(argv.slice(1), options);
    case "os-open":
      return runOsOpenCommand(argv.slice(1), options);
    case "os-run":
      return runOsRunCommand(argv.slice(1), options);
    case "os-copy-path":
      return runOsCopyPathCommand(argv.slice(1), options);
    case "os-clean":
      return runOsCleanCommand(argv.slice(1), options);
    default:
      process.stderr.write(`unknown command: ${command}
`);
      return 2;
  }
}
async function runValidate(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, "--json");
  const all = consumeFlag(args, "--all");
  const allowEmpty = consumeFlag(args, "--allow-empty");
  const profile = consumeOption(args, "--profile");
  if (profile === null) {
    process.stderr.write("--profile requires a value\n");
    return 2;
  }
  const resolvedProfile = profile ?? "canonical";
  if (!["canonical", "claude-code"].includes(resolvedProfile)) {
    process.stderr.write(`Unknown profile: ${resolvedProfile}
`);
    return 2;
  }
  const paths = args.filter((item) => !item.startsWith("--"));
  const root = await resolveRuntimeRoot(options, { explicitPaths: paths.length > 0 });
  const scanAll = paths.length === 0 || all;
  const result = await verifySkillPaths(paths, {
    root,
    all: scanAll,
    allowEmpty,
    profile: resolvedProfile,
    // Full install validate includes dependency graph; path-targeted validate stays local.
    dependencies: scanAll
  });
  if (json) process.stdout.write(`${JSON.stringify(result, null, 2)}
`);
  else process.stdout.write(result.text);
  return result.ok ? 0 : 1;
}
function consumeFlag(values, flag) {
  const index = values.indexOf(flag);
  if (index === -1) return false;
  values.splice(index, 1);
  return true;
}
function consumeOption(values, flag) {
  const index = values.indexOf(flag);
  if (index === -1) return void 0;
  const value = values[index + 1];
  if (!value || value.startsWith("--")) {
    values.splice(index, 1);
    return null;
  }
  values.splice(index, 2);
  return value;
}
function consumeOptions(values, flag) {
  const picked = [];
  for (; ; ) {
    const index = values.indexOf(flag);
    if (index === -1) return picked;
    const value = values[index + 1];
    if (!value || value.startsWith("--")) {
      values.splice(index, 1);
      return null;
    }
    picked.push(value);
    values.splice(index, 2);
  }
}
function resolveUserPath(root, value, allowAbsolute = false) {
  return resolveUnderRoot(root, value, { allowAbsolute });
}
async function runDoctorCommand(argv, options) {
  const json = argv.includes("--json");
  const result = await runDoctor(await resolveRuntimeRoot(options));
  if (json) process.stdout.write(`${JSON.stringify(result, null, 2)}
`);
  else {
    for (const check of result.checks) {
      process.stdout.write(`${check.ok ? "PASS" : "FAIL"} ${check.name}: ${check.detail}
`);
    }
  }
  return result.ok ? 0 : 1;
}
async function runRoute(argv, options) {
  const args = [...argv];
  const pack = consumeOption(args, "--pack");
  if (pack === null) {
    process.stderr.write("--pack requires a value\n");
    return 2;
  }
  const includeExplicit = consumeFlag(args, "--include-explicit");
  const queryIndex = args.indexOf("--query");
  const query = queryIndex >= 0 ? args[queryIndex + 1] : args.filter((item) => !item.startsWith("--")).join(" ");
  if (!query) {
    process.stderr.write("usage: skillsforge route --query <text> [--pack <id>] [--include-explicit]\n");
    return 2;
  }
  const skills = await loadAllSkills(await resolveRuntimeRoot(options));
  const result = routeQuery(query, skills, {
    pack: pack ?? void 0,
    includeExplicit: includeExplicit || Boolean(pack)
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}
`);
  return 0;
}
async function runForge(argv, options) {
  const specIndex = argv.indexOf("--spec");
  if (specIndex < 0 || !argv[specIndex + 1]) {
    process.stderr.write("usage: skillsforge forge --spec <file> [--dry-run|--write] [--force] [--out <dir>]\n");
    return 2;
  }
  const outIndex = argv.indexOf("--out");
  const spec = JSON.parse(await readFile17(argv[specIndex + 1], "utf8"));
  const root = await resolveRuntimeRoot(options);
  const result = await forgeSkill(spec, {
    write: argv.includes("--write"),
    dryRun: !argv.includes("--write"),
    force: argv.includes("--force"),
    outRoot: outIndex >= 0 ? argv[outIndex + 1] : join19(root, ...await isPluginRoot(root) ? ["skills"] : ["plugins", "skillsforge", "skills"])
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}
`);
  return result.ok ? 0 : 1;
}
async function resolvePackageRoot(root, packageOption) {
  if (packageOption) return resolve17(packageOption);
  if (await isPluginRoot(root)) return root;
  const distPackage = join19(root, "dist", "claude-code");
  if (await pathExists7(join19(distPackage, ".claude-plugin", "plugin.json"))) return distPackage;
  if (await isRepositoryRoot(root)) return join19(root, "plugins", "skillsforge");
  return root;
}
async function runReceipt(argv, options) {
  const args = [...argv];
  const out = consumeOption(args, "--out");
  if (out === null) {
    process.stderr.write("--out requires a value\n");
    return 2;
  }
  const packageOption = consumeOption(args, "--package");
  if (packageOption === null) {
    process.stderr.write("--package requires a value\n");
    return 2;
  }
  const evaluationOption = consumeOption(args, "--evaluation");
  if (evaluationOption === null) {
    process.stderr.write("--evaluation requires a value\n");
    return 2;
  }
  const requireEvaluation = consumeFlag(args, "--require-evaluation");
  const root = await resolveRuntimeRoot(options);
  const packageRoot = await resolvePackageRoot(root, packageOption);
  const receiptOut = out ?? join19(root, "dist", "trust-receipt.json");
  const skills = await loadAllSkills(packageRoot);
  const graph = analyzeDependencies(skills);
  if (graph.cycles.length || graph.missing.length || graph.duplicates.length) {
    process.stderr.write(`${JSON.stringify(graph, null, 2)}
`);
    return 1;
  }
  let evaluation = null;
  let reportBytes = null;
  const evaluationPath = evaluationOption ?? join19(root, "artifacts", "evaluation", "routing-report.json");
  try {
    reportBytes = await readFile17(evaluationPath);
    evaluation = normalizeEvaluation(JSON.parse(reportBytes.toString("utf8")), { reportBytes });
  } catch {
  }
  const result = await buildReceipt(skills, {
    evaluation,
    packageRoot,
    reportBytes,
    requireEvaluation
  });
  if (!result.ok) {
    process.stderr.write(`${JSON.stringify(result, null, 2)}
`);
    return 1;
  }
  await mkdir11(dirname8(receiptOut), { recursive: true });
  await writeFile11(receiptOut, result.text);
  process.stdout.write(`${JSON.stringify({
    ok: true,
    out: receiptOut,
    receiptHash: result.receiptHash,
    packageHash: result.receipt.package?.packageHash ?? null
  }, null, 2)}
`);
  return 0;
}
async function runVerifyReceipt(argv, options) {
  const args = [...argv];
  const packageOnly = consumeFlag(args, "--package-only");
  const packageOption = consumeOption(args, "--package");
  if (packageOption === null) {
    process.stderr.write("--package requires a value\n");
    return 2;
  }
  const evaluationOption = consumeOption(args, "--evaluation");
  if (evaluationOption === null) {
    process.stderr.write("--evaluation requires a value\n");
    return 2;
  }
  const receiptSha256 = consumeOption(args, "--receipt-sha256");
  if (receiptSha256 === null) {
    process.stderr.write("--receipt-sha256 requires a value\n");
    return 2;
  }
  const path = args.find((item) => !item.startsWith("--"));
  if (!path) {
    process.stderr.write("usage: skillsforge verify-receipt <file> [--package <dir>] [--evaluation <routing-report.json>|--package-only] [--receipt-sha256 <hash>]\n");
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  const packageRoot = await resolvePackageRoot(root, packageOption);
  const skills = await loadAllSkills(packageRoot);
  const verifyOptions = {
    packageRoot,
    packageOnly,
    requireEvaluation: !packageOnly,
    expectedReceiptHash: receiptSha256 || void 0
  };
  if (!packageOnly && evaluationOption) {
    verifyOptions.evaluationPath = resolve17(evaluationOption);
  } else if (!packageOnly) {
    const defaultEval = join19(root, "artifacts", "evaluation", "routing-report.json");
    if (await pathExists7(defaultEval)) verifyOptions.evaluationPath = defaultEval;
  }
  const result = await verifyReceipt(path, skills, verifyOptions);
  process.stdout.write(`${JSON.stringify(result, null, 2)}
`);
  return result.ok ? 0 : 1;
}
async function runEnforce(argv) {
  const policyIndex = argv.indexOf("--policy");
  if (policyIndex < 0 || !argv[policyIndex + 1]) {
    process.stderr.write("usage: skillsforge enforce --policy <sidecar.json>\n");
    return 2;
  }
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const event = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  const policyPath = resolve17(argv[policyIndex + 1]);
  const policy = JSON.parse(await readFile17(policyPath, "utf8"));
  policy.__skillRoot = dirname8(policyPath);
  policy.__projectRoot = event?.cwd || process.env.CLAUDE_PROJECT_DIR || process.env.CLAUDE_CWD || process.cwd();
  const decision = enforcePolicy(event, policy);
  if (decision) process.stdout.write(`${JSON.stringify(decision)}
`);
  return 0;
}
async function runEvalCommand(argv, options) {
  const { runEvaluation: runEvaluation2, HOLDOUT_PRECISION_MIN: HOLDOUT_PRECISION_MIN2, HOLDOUT_RECALL_MIN: HOLDOUT_RECALL_MIN2 } = await init_eval().then(() => eval_exports);
  const report = await runEvaluation2({ root: await resolveRuntimeRoot(options) });
  process.stdout.write(`${JSON.stringify(report, null, 2)}
`);
  return report.precision >= HOLDOUT_PRECISION_MIN2 && report.recall >= HOLDOUT_RECALL_MIN2 ? 0 : 1;
}
async function runHostsCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, "--json");
  const homeOption = consumeOption(args, "--home");
  if (homeOption === null) {
    process.stderr.write("--home requires a value\n");
    return 2;
  }
  if (args.some((item) => item.startsWith("--"))) {
    process.stderr.write(`unknown hosts option: ${args.find((item) => item.startsWith("--"))}
`);
    return 2;
  }
  if (args.length) {
    process.stderr.write(`unknown hosts argument: ${args[0]}
`);
    return 2;
  }
  const home = homeOption ? resolve17(homeOption) : options.home;
  const hosts = await detectHosts({ home });
  const registry = HOST_REGISTRY.map((host) => ({
    id: host.id,
    label: host.label,
    fidelity: host.fidelity,
    runtimeEnforced: host.runtimeEnforced,
    usesSidecar: host.usesSidecar,
    installHint: host.installHint
  }));
  const examples = [
    "skillsforge install --hosts codex,claude-code --yes --dry-run",
    "skillsforge install --hosts all --yes --dry-run",
    "skillsforge install --custom-host my-agent:.my-agent/skills --yes --dry-run"
  ];
  const payload = { ok: true, registry, hosts, examples };
  if (json) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}
`);
    return 0;
  }
  process.stdout.write("Universal AI CLI hosts\n");
  for (const host of hosts) {
    const mark = host.detected ? "detected" : "missing";
    const policy = host.runtimeEnforced ? "runtime-policy" : "package-only";
    process.stdout.write(`${host.id}	${mark}	${host.fidelity}	${policy}	${host.skillsDir}
`);
    process.stdout.write(`  ${host.installHint}
`);
  }
  process.stdout.write("Examples:\n");
  for (const example of examples) process.stdout.write(`  ${example}
`);
  return 0;
}
async function runInstall(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, "--json");
  const list = consumeFlag(args, "--list");
  const yes = consumeFlag(args, "--yes");
  const dryRun = consumeFlag(args, "--dry-run");
  const force = consumeFlag(args, "--force");
  const customSpecs = consumeOptions(args, "--custom-host");
  if (customSpecs === null) {
    process.stderr.write("--custom-host requires <id>:<skills-dir>\n");
    return 2;
  }
  const hostsOption = consumeOption(args, "--hosts");
  if (hostsOption === null) {
    process.stderr.write("--hosts requires a value\n");
    return 2;
  }
  const homeOption = consumeOption(args, "--home");
  if (homeOption === null) {
    process.stderr.write("--home requires a value\n");
    return 2;
  }
  const home = homeOption ? resolve17(homeOption) : options.home;
  const skillPaths = args.filter((item) => !item.startsWith("--"));
  const root = await resolveRuntimeRoot(options, { explicitPaths: skillPaths.length > 0 });
  const detected = await detectHosts({ home });
  if (list) {
    const payload = {
      ok: true,
      registry: HOST_REGISTRY.map((host) => ({
        id: host.id,
        label: host.label,
        fidelity: host.fidelity,
        runtimeEnforced: host.runtimeEnforced,
        usesSidecar: host.usesSidecar,
        installHint: host.installHint
      })),
      hosts: detected
    };
    if (json) process.stdout.write(`${JSON.stringify(payload, null, 2)}
`);
    else {
      for (const host of detected) {
        const mark = host.detected ? "detected" : "missing";
        process.stdout.write(`${host.id}	${mark}	${host.fidelity}	${host.skillsDir}
`);
      }
    }
    return 0;
  }
  let hostIds = hostsOption ? hostsOption.split(",").map((item) => item.trim()).filter(Boolean) : null;
  if (hostIds?.length === 1 && hostIds[0] === "all") {
    hostIds = HOST_REGISTRY.map((host) => host.id);
  } else if (hostIds?.length === 1 && hostIds[0] === "detected") {
    hostIds = detected.filter((host) => host.detected).map((host) => host.id);
  } else if (hostIds?.includes("all") || hostIds?.includes("detected")) {
    process.stderr.write("--hosts all|detected cannot be combined with other ids\n");
    return 2;
  }
  let customHosts;
  try {
    customHosts = customSpecs.map((spec) => buildCustomHost(spec, { home }));
  } catch (error) {
    process.stderr.write(`${error.message}
`);
    return 2;
  }
  if (!hostIds) {
    if (customHosts.length) {
      hostIds = [];
    } else if (yes) {
      process.stderr.write("install --yes requires --hosts <ids> or --custom-host <id>:<skills-dir>\n");
      return 2;
    } else {
      const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
      if (!interactive) {
        process.stderr.write("usage: skillsforge install --hosts <ids> --yes [skill-paths...]\n");
        process.stderr.write("       (interactive picker requires a TTY; use --list to see hosts)\n");
        return 2;
      }
      try {
        const picked = await pickHosts(detected);
        if (picked == null) {
          process.stderr.write("install aborted\n");
          return 1;
        }
        hostIds = picked;
      } catch (error) {
        process.stderr.write(`${error.message}
`);
        return 2;
      }
    }
  }
  if (!hostIds.length && !customHosts.length) {
    process.stderr.write("no hosts selected\n");
    return 1;
  }
  const selection = hostIds.length ? await resolveHostSelection(hostIds, { home }) : { selected: [], unknown: [], all: detected };
  if (selection.unknown.length) {
    process.stderr.write(`unknown hosts: ${selection.unknown.join(", ")}
`);
    process.stderr.write(`known: ${HOST_REGISTRY.map((host) => host.id).join(", ")} or --custom-host <id>:<skills-dir>
`);
    return 2;
  }
  const selectedHosts = [...selection.selected, ...customHosts];
  const result = await installSkills({
    hosts: selectedHosts,
    home,
    root,
    skillPaths: skillPaths.length ? skillPaths : void 0,
    dryRun,
    force
  });
  if (json) process.stdout.write(`${JSON.stringify(result, null, 2)}
`);
  else {
    if (!result.ok) {
      process.stdout.write(`FAIL install: ${result.error ?? "unknown"}
`);
      if (result.validation?.text) process.stdout.write(result.validation.text);
    } else {
      for (const item of result.installs) {
        process.stdout.write(`${item.status.toUpperCase()} ${item.host}/${item.skill} -> ${item.dir}
`);
      }
      process.stdout.write(`OK install (${result.dryRun ? "dry-run" : "wrote"} ${result.installs.length} target(s))
`);
    }
  }
  return result.ok ? 0 : 1;
}
async function runPackage(argv, options) {
  const args = [...argv];
  const host = consumeOption(args, "--host");
  if (host === null) {
    process.stderr.write("--host requires a value\n");
    return 2;
  }
  const skill = consumeOption(args, "--skill");
  if (skill === null) {
    process.stderr.write("--skill requires a value\n");
    return 2;
  }
  const out = consumeOption(args, "--out");
  if (out === null) {
    process.stderr.write("--out requires a value\n");
    return 2;
  }
  const write = consumeFlag(args, "--write");
  consumeFlag(args, "--dry-run");
  const force = consumeFlag(args, "--force");
  const allowAbsolute = consumeFlag(args, "--allow-absolute");
  if (!host || !skill || !out) {
    process.stderr.write("usage: skillsforge package --host codex --skill <dir> --out <dir> [--force] [--dry-run|--write]\n");
    return 2;
  }
  if (host !== "codex") {
    process.stderr.write(`unsupported package host: ${host} (supported: codex)
`);
    return 2;
  }
  if (args.some((item) => item.startsWith("--"))) {
    process.stderr.write(`unknown package option: ${args.find((item) => item.startsWith("--"))}
`);
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  let skillDir;
  let outDir;
  try {
    skillDir = resolveUnderRoot(root, skill, { allowAbsolute });
    outDir = resolveUnderRoot(root, out, { allowAbsolute });
  } catch (error) {
    process.stderr.write(`${error.message}
`);
    return 1;
  }
  const result = await packageCodexPlugin({
    skillDir,
    outDir,
    write,
    dryRun: !write,
    force
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}
`);
  return result.ok ? 0 : 1;
}
async function runEvidence(argv, options) {
  const args = [...argv];
  const out = consumeOption(args, "--out");
  const allowAbsolute = consumeFlag(args, "--allow-absolute");
  if (out === null) {
    process.stderr.write("--out requires a value\n");
    return 2;
  }
  if (!out) {
    process.stderr.write("usage: skillsforge evidence --out <dir>\n");
    return 2;
  }
  if (args.some((item) => item.startsWith("--"))) {
    process.stderr.write(`unknown evidence option: ${args.find((item) => item.startsWith("--"))}
`);
    return 2;
  }
  const { buildEvidenceBundleWithPackageMeta: buildEvidenceBundleWithPackageMeta2 } = await Promise.resolve().then(() => (init_evidence(), evidence_exports));
  const root = await resolveRuntimeRoot(options);
  let outDir;
  try {
    outDir = resolveUserPath(root, out, allowAbsolute);
  } catch (error) {
    process.stderr.write(`${error.message}
`);
    return 1;
  }
  const result = await buildEvidenceBundleWithPackageMeta2({
    root,
    outDir,
    write: true
  });
  process.stdout.write(`${JSON.stringify({
    ok: result.ok,
    outDir: result.outDir,
    bundleHash: result.bundleHash,
    files: result.files
  }, null, 2)}
`);
  return result.ok ? 0 : 1;
}
async function runVibeCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, "--json");
  const root = await resolveRuntimeRoot(options);
  const result = await runVibe(root, { json });
  if (json) process.stdout.write(`${JSON.stringify(result.data, null, 2)}
`);
  else process.stdout.write(result.text);
  return result.ok ? 0 : 1;
}
async function runCatalogCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, "--json");
  const pack = consumeOption(args, "--pack");
  const profile = consumeOption(args, "--profile");
  const search = consumeOption(args, "--search");
  if (pack === null || profile === null || search === null) {
    process.stderr.write("option requires a value\n");
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  const { catalog } = await loadCatalog(root);
  let payload;
  if (search) payload = { search, hits: searchCatalog(catalog, search) };
  else if (pack) payload = { pack, skills: skillsForPack(catalog, pack) };
  else if (profile) payload = { profile, skills: skillsForProfile(catalog, profile) };
  else {
    payload = {
      stats: catalogStats(catalog),
      packs: listPacks(catalog),
      profiles: listProfiles(catalog)
    };
  }
  if (json) process.stdout.write(`${JSON.stringify(payload, null, 2)}
`);
  else {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}
`);
  }
  return 0;
}
async function runQualityCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, "--json");
  const skill = consumeOption(args, "--skill");
  const allowAbsolute = consumeFlag(args, "--allow-absolute");
  if (!skill) {
    process.stderr.write("usage: skillsforge quality --skill <dir>\n");
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  let skillDir;
  try {
    skillDir = resolveUserPath(root, skill, allowAbsolute);
  } catch (error) {
    process.stderr.write(`${error.message}
`);
    return 1;
  }
  const result = await scoreSkillQuality(skillDir, { root });
  process.stdout.write(`${JSON.stringify(result, null, 2)}
`);
  return result.pass ? 0 : 1;
}
async function runLintSkillCommand(argv, options) {
  const args = [...argv];
  const skill = consumeOption(args, "--skill");
  const thresholdRaw = consumeOption(args, "--threshold");
  const hero = consumeFlag(args, "--hero");
  const allowAbsolute = consumeFlag(args, "--allow-absolute");
  if (!skill) {
    process.stderr.write("usage: skillsforge lint-skill --skill <dir> [--threshold n] [--hero]\n");
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  let skillDir;
  try {
    skillDir = resolveUserPath(root, skill, allowAbsolute);
  } catch (error) {
    process.stderr.write(`${error.message}
`);
    return 1;
  }
  const result = await lintSkill(skillDir, {
    root,
    threshold: thresholdRaw ? Number(thresholdRaw) : 70,
    hero
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}
`);
  return result.ok ? 0 : 1;
}
async function runScaffoldCommand(argv, options) {
  const args = [...argv];
  const name = consumeOption(args, "--name");
  const pack = consumeOption(args, "--pack") ?? "eng";
  const mode = consumeOption(args, "--mode") ?? "explicit";
  const write = consumeFlag(args, "--write");
  const force = consumeFlag(args, "--force");
  if (!name) {
    process.stderr.write("usage: skillsforge scaffold --name <id> [--pack <id>] [--mode auto|explicit] [--write] [--force]\n");
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  const result = await scaffoldSkill(root, { name, pack, mode }, { write, force, dryRun: !write });
  process.stdout.write(`${JSON.stringify(result, null, 2)}
`);
  return result.ok ? 0 : 1;
}
async function runBenchCommand(argv, options) {
  const root = await resolveRuntimeRoot(options);
  const result = await runBench(root);
  process.stdout.write(`${JSON.stringify(result.summary, null, 2)}
`);
  return result.ok ? 0 : 1;
}
async function runScorecardCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, "--json");
  const root = await resolveRuntimeRoot(options);
  const result = await runScorecard(root);
  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}
`);
  } else {
    process.stdout.write(`${formatPackScorecard(result, { color: true })}
`);
    process.stdout.write(`${JSON.stringify(result, null, 2)}
`);
  }
  return 0;
}
async function runComposeCommand(argv, options) {
  const args = [...argv];
  const workflow = consumeOption(args, "--workflow");
  const allowAbsolute = consumeFlag(args, "--allow-absolute");
  if (!workflow) {
    process.stderr.write("usage: skillsforge compose --workflow <file>\n");
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  let workflowPath;
  try {
    workflowPath = resolveUnderRoot(root, workflow, { allowAbsolute });
  } catch (error) {
    process.stderr.write(`${error.message}
`);
    return 1;
  }
  const result = await runCompose(root, workflowPath);
  process.stdout.write(`${JSON.stringify(result, null, 2)}
`);
  return result.ok ? 0 : 1;
}
async function runStocktakeCommand(argv, options) {
  const root = await resolveRuntimeRoot(options);
  const result = await runStocktake(root);
  process.stdout.write(`${JSON.stringify(result, null, 2)}
`);
  return result.missing.length === 0 ? 0 : 1;
}
async function runBatchCommand(argv, options) {
  const args = [...argv];
  const pack = consumeOption(args, "--pack");
  const action = consumeOption(args, "--action") ?? "quality";
  if (!pack) {
    process.stderr.write("usage: skillsforge batch --pack <id> --action quality|validate|skillshield\n");
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  const { catalog } = await loadCatalog(root);
  const ids = skillsForPack(catalog, pack) ?? [];
  const reports = [];
  for (const id of ids) {
    const dir = join19(root, "plugins", "skillsforge", "skills", id);
    if (!await pathExists7(dir)) {
      reports.push({ id, ok: false, error: "missing" });
      continue;
    }
    if (action === "quality") reports.push({ id, ...await scoreSkillQuality(dir, { root }) });
    else if (action === "skillshield") reports.push({ id, ...await runSkillShield(dir, { root }) });
    else {
      const { verifySkillPaths: verifySkillPaths2 } = await Promise.resolve().then(() => (init_verify(), verify_exports));
      const v = await verifySkillPaths2([dir], { root, profile: "claude-code" });
      reports.push({ id, ok: v.ok });
    }
  }
  const ok = reports.every((r) => r.ok || r.pass);
  process.stdout.write(`${JSON.stringify({ pack, action, ok, reports }, null, 2)}
`);
  return ok ? 0 : 1;
}
async function runPressureCommand(argv, options) {
  const args = [...argv];
  const skill = consumeOption(args, "--skill");
  const allowAbsolute = consumeFlag(args, "--allow-absolute");
  if (!skill) {
    process.stderr.write("usage: skillsforge pressure --skill <dir>\n");
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  let skillDir;
  try {
    skillDir = resolveUserPath(root, skill, allowAbsolute);
  } catch (error) {
    process.stderr.write(`${error.message}
`);
    return 1;
  }
  const result = await runPressure(skillDir);
  process.stdout.write(`${JSON.stringify(result, null, 2)}
`);
  return result.ok ? 0 : 1;
}
async function runSkillShieldCommand(argv, options) {
  const args = [...argv];
  const all = consumeFlag(args, "--all");
  const skill = consumeOption(args, "--skill");
  const allowAbsolute = consumeFlag(args, "--allow-absolute");
  const root = await resolveRuntimeRoot(options);
  if (all) {
    const skills = await loadAllSkills(root);
    const result = await runSkillShieldMany(skills.map((s) => s.directory), { root });
    process.stdout.write(`${JSON.stringify(result, null, 2)}
`);
    return result.ok ? 0 : 1;
  }
  if (!skill) {
    process.stderr.write("usage: skillsforge skillshield --skill <dir> | --all\n");
    return 2;
  }
  try {
    const result = await runSkillShield(resolveUserPath(root, skill, allowAbsolute), { root });
    process.stdout.write(`${JSON.stringify(result, null, 2)}
`);
    return result.ok ? 0 : 1;
  } catch (error) {
    process.stderr.write(`${error.message}
`);
    return 1;
  }
}
async function runExportAgentsCommand(argv, options) {
  const args = [...argv];
  const out = consumeOption(args, "--out");
  const allowAbsolute = consumeFlag(args, "--allow-absolute");
  const root = await resolveRuntimeRoot(options);
  const result = await exportAgentsMd(root, {
    out: out ?? void 0,
    allowAbsolute
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}
`);
  return result.ok ? 0 : 1;
}
async function runCaptureCommand(argv, options) {
  const args = [...argv];
  const insight = consumeOption(args, "--insight");
  const key = consumeOption(args, "--key");
  if (!insight) {
    process.stderr.write("usage: skillsforge capture --insight <text> [--key <slug>]\n");
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  const result = await captureLearning(root, { insight, key: key ?? void 0 });
  process.stdout.write(`${JSON.stringify(result, null, 2)}
`);
  return result.ok ? 0 : 1;
}
async function runForgeFromCaptureCommand(argv, options) {
  const root = await resolveRuntimeRoot(options);
  const result = await forgeFromCapture(root);
  process.stdout.write(`${JSON.stringify(result, null, 2)}
`);
  return result.ok ? 0 : 1;
}
async function runCompareCommand(argv, options) {
  const args = [...argv];
  const a = consumeOption(args, "--a");
  const b = consumeOption(args, "--b");
  const allowAbsolute = consumeFlag(args, "--allow-absolute");
  if (!a || !b) {
    process.stderr.write("usage: skillsforge compare --a <dir> --b <dir>\n");
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  let leftDir;
  let rightDir;
  try {
    leftDir = resolveUnderRoot(root, a, { allowAbsolute });
    rightDir = resolveUnderRoot(root, b, { allowAbsolute });
  } catch (error) {
    process.stderr.write(`${error.message}
`);
    return 1;
  }
  const left = await loadSkill(leftDir, { root });
  const right = await loadSkill(rightDir, { root });
  const payload = {
    a: { name: left.name, description: left.description, routing: left.sidecar?.routing },
    b: { name: right.name, description: right.description, routing: right.sidecar?.routing },
    sameDescription: left.description === right.description,
    sameTriggers: JSON.stringify(left.sidecar?.routing?.triggers) === JSON.stringify(right.sidecar?.routing?.triggers)
  };
  process.stdout.write(`${JSON.stringify(payload, null, 2)}
`);
  return 0;
}
async function runCompareSkillCommand(argv, options) {
  const args = [...argv];
  const a = consumeOption(args, "--a");
  const b = consumeOption(args, "--b");
  const allowAbsolute = consumeFlag(args, "--allow-absolute");
  if (!a || !b) {
    process.stderr.write("usage: skillsforge compare-skill --a <dir> --b <dir>\n");
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  let leftDir;
  let rightDir;
  try {
    leftDir = resolveUnderRoot(root, a, { allowAbsolute });
    rightDir = resolveUnderRoot(root, b, { allowAbsolute });
  } catch (error) {
    process.stderr.write(`${error.message}
`);
    return 1;
  }
  const payload = await compareSkillTrust(root, leftDir, rightDir);
  process.stdout.write(`${JSON.stringify(payload, null, 2)}
`);
  return 0;
}
async function runDemoCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, "--json");
  const root = await resolveRuntimeRoot(options);
  const result = await runJudgeDemo(root, { color: !json });
  if (result.scoreboard && !json) {
    process.stdout.write(`${result.scoreboard}

`);
  }
  process.stdout.write(`${JSON.stringify({
    ok: result.ok,
    elapsedMs: result.elapsedMs,
    underBudget: result.underBudget,
    falseAllow: result.falseAllow,
    receiptHash: result.receiptHash,
    evidencePath: result.evidencePath,
    urls: result.urls,
    steps: result.steps,
    error: result.error
  }, null, 2)}
`);
  return result.ok ? 0 : 1;
}
async function runOsEnvCommand(argv) {
  const args = [...argv];
  const json = consumeFlag(args, "--json");
  const name = consumeOption(args, "--name");
  if (name === null) return usage("--name requires a value");
  if (hasUnknownOption(args)) return usage(`unknown option: ${hasUnknownOption(args)}`);
  if (name) {
    const exists = Object.hasOwn(process.env, name);
    return writeOsResult({
      ok: exists,
      command: "os-env",
      name,
      exists,
      value: exists ? process.env[name] : null
    }, json, ({ value }) => `${value ?? ""}
`, exists ? 0 : 1);
  }
  const pathEntries = String(process.env.PATH ?? process.env.Path ?? "").split(process.platform === "win32" ? ";" : ":").filter(Boolean);
  return writeOsResult({
    ok: true,
    command: "os-env",
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    cwd: process.cwd(),
    shell: process.env.SHELL ?? process.env.ComSpec ?? null,
    home: process.env.HOME ?? process.env.USERPROFILE ?? null,
    pathEntries,
    envKeys: Object.keys(process.env).sort()
  }, json, (payload) => [
    `platform=${payload.platform}`,
    `arch=${payload.arch}`,
    `node=${payload.node}`,
    `cwd=${payload.cwd}`,
    `shell=${payload.shell ?? ""}`,
    `pathEntries=${payload.pathEntries.length}`,
    `envKeys=${payload.envKeys.length}`
  ].join("\n") + "\n");
}
async function runOsFindCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, "--json");
  const allowAbsolute = consumeFlag(args, "--allow-absolute");
  const name = consumeOption(args, "--name");
  const rootOption = consumeOption(args, "--root") ?? ".";
  const limitValue = consumeOption(args, "--limit") ?? "200";
  if (name === null) return usage("--name requires a value");
  if (rootOption === null) return usage("--root requires a value");
  if (limitValue === null) return usage("--limit requires a value");
  if (!name) return usage("usage: skillsforge os-find --name <glob> [--root <dir>] [--json]");
  if (hasUnknownOption(args)) return usage(`unknown option: ${hasUnknownOption(args)}`);
  const repoRoot = await resolveRuntimeRoot(options);
  let root;
  try {
    root = resolveUserPath(repoRoot, rootOption, allowAbsolute);
  } catch (error) {
    return failOsResult("os-find", error.message, json);
  }
  const limit = Math.max(1, Math.min(1e3, Number(limitValue) || 200));
  const regex = globToRegExp(name);
  const matches = [];
  await walkFind(root, root, regex, matches, limit);
  return writeOsResult({
    ok: true,
    command: "os-find",
    root,
    pattern: name,
    limit,
    truncated: matches.length >= limit,
    matches
  }, json, (payload) => payload.matches.map((item) => `${item.type}	${item.path}`).join("\n") + (payload.matches.length ? "\n" : ""));
}
async function runOsPortsCommand(argv) {
  const args = [...argv];
  const json = consumeFlag(args, "--json");
  if (hasUnknownOption(args)) return usage(`unknown option: ${hasUnknownOption(args)}`);
  const attempts = process.platform === "win32" ? [["netstat", ["-ano", "-p", "tcp"]]] : [["lsof", ["-nP", "-iTCP", "-sTCP:LISTEN"]], ["netstat", ["-an"]]];
  for (const [command, commandArgs] of attempts) {
    const result = await runProcess(command, commandArgs, { timeoutMs: 5e3 });
    if (result.status === 0 && result.stdout.trim()) {
      const lines = result.stdout.split(/\r?\n/).filter(Boolean).slice(0, 200);
      return writeOsResult({
        ok: true,
        command: "os-ports",
        probe: [command, ...commandArgs].join(" "),
        lines
      }, json, (payload) => payload.lines.join("\n") + "\n");
    }
  }
  return failOsResult("os-ports", "no port probe command succeeded", json);
}
async function runOsOpenCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, "--json");
  const dryRun = consumeFlag(args, "--dry-run");
  const allowAbsolute = consumeFlag(args, "--allow-absolute");
  const target = args.shift();
  if (!target) return usage("usage: skillsforge os-open <path-or-url> [--dry-run] [--json]");
  if (hasUnknownOption(args)) return usage(`unknown option: ${hasUnknownOption(args)}`);
  const repoRoot = await resolveRuntimeRoot(options);
  let resolved = target;
  if (!isUrlLike(target)) {
    try {
      resolved = resolveUserPath(repoRoot, target, allowAbsolute);
    } catch (error) {
      return failOsResult("os-open", error.message, json);
    }
  }
  const launcher = platformOpenCommand(resolved);
  const payload = {
    ok: true,
    command: "os-open",
    dryRun,
    target: resolved,
    launcher: [launcher.command, ...launcher.args]
  };
  if (dryRun) {
    return writeOsResult(payload, json, (item) => `${item.launcher.join(" ")}
`);
  }
  const result = await runProcess(launcher.command, launcher.args, { timeoutMs: 1e4 });
  return writeOsResult({ ...payload, result }, json, () => result.stderr || result.stdout || "", result.status === 0 ? 0 : 1);
}
async function runOsRunCommand(argv, options) {
  const split = splitCommandArgs(argv);
  const args = [...split.options];
  const json = consumeFlag(args, "--json");
  const dryRunFlag = consumeFlag(args, "--dry-run");
  const yes = consumeFlag(args, "--yes");
  const cwdOption = consumeOption(args, "--cwd") ?? ".";
  const timeoutValue = consumeOption(args, "--timeout-ms") ?? "30000";
  if (cwdOption === null) return usage("--cwd requires a value");
  if (timeoutValue === null) return usage("--timeout-ms requires a value");
  if (hasUnknownOption(args)) return usage(`unknown option: ${hasUnknownOption(args)}`);
  if (split.command.length === 0) return usage("usage: skillsforge os-run [--yes|--dry-run] -- <cmd> [args...]");
  const root = await resolveRuntimeRoot(options);
  let cwd;
  try {
    cwd = resolveUserPath(root, cwdOption, true);
  } catch (error) {
    return failOsResult("os-run", error.message, json);
  }
  const [command, ...commandArgs] = split.command;
  const timeoutMs = Math.max(1e3, Math.min(3e5, Number(timeoutValue) || 3e4));
  const dryRun = dryRunFlag || !yes;
  const payload = {
    ok: true,
    command: "os-run",
    dryRun,
    cwd,
    timeoutMs,
    argv: [command, ...commandArgs]
  };
  if (dryRun) {
    return writeOsResult(payload, json, (item) => `${item.argv.join(" ")}
`);
  }
  const result = await runProcess(command, commandArgs, { cwd, timeoutMs });
  return writeOsResult({ ...payload, result, ok: result.status === 0 }, json, () => result.stdout + result.stderr, result.status === 0 ? 0 : 1);
}
async function runOsCopyPathCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, "--json");
  const allowAbsolute = consumeFlag(args, "--allow-absolute");
  const target = args.shift();
  if (!target) return usage("usage: skillsforge os-copy-path <path> [--json]");
  if (hasUnknownOption(args)) return usage(`unknown option: ${hasUnknownOption(args)}`);
  const root = await resolveRuntimeRoot(options);
  try {
    const resolved = resolveUserPath(root, target, allowAbsolute);
    return writeOsResult({ ok: true, command: "os-copy-path", path: resolved }, json, (payload) => `${payload.path}
`);
  } catch (error) {
    return failOsResult("os-copy-path", error.message, json);
  }
}
async function runOsCleanCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, "--json");
  const allowAbsolute = consumeFlag(args, "--allow-absolute");
  const rootOption = consumeOption(args, "--root") ?? ".";
  if (rootOption === null) return usage("--root requires a value");
  if (hasUnknownOption(args)) return usage(`unknown option: ${hasUnknownOption(args)}`);
  const repoRoot = await resolveRuntimeRoot(options);
  let root;
  try {
    root = resolveUserPath(repoRoot, rootOption, allowAbsolute);
  } catch (error) {
    return failOsResult("os-clean", error.message, json);
  }
  const names = ["node_modules", "dist", "artifacts", "coverage", ".next", ".turbo", "tests/.tmp-runner"];
  const candidates = [];
  for (const name of names) {
    const path = resolve17(root, name);
    if (await pathExists7(path)) {
      candidates.push({
        path,
        relativePath: relative10(root, path).replaceAll("\\", "/"),
        bytes: await directorySize(path)
      });
    }
  }
  return writeOsResult({
    ok: true,
    command: "os-clean",
    dryRun: true,
    root,
    candidates,
    note: "phase 1 inventory only; no files deleted"
  }, json, (payload) => payload.candidates.map((item) => `${item.bytes}	${item.relativePath}`).join("\n") + (payload.candidates.length ? "\n" : ""));
}
async function runWatchCommand(argv, options) {
  const args = [...argv];
  const skill = consumeOption(args, "--skill");
  const allowAbsolute = consumeFlag(args, "--allow-absolute");
  if (!skill) {
    process.stderr.write("usage: skillsforge watch --skill <dir> (single quality pass)\n");
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  let skillDir;
  try {
    skillDir = resolveUserPath(root, skill, allowAbsolute);
  } catch (error) {
    process.stderr.write(`${error.message}
`);
    return 1;
  }
  const result = await scoreSkillQuality(skillDir, { root });
  process.stdout.write(`${JSON.stringify({ watch: "single-pass", ...result }, null, 2)}
`);
  return result.pass ? 0 : 1;
}
function usage(message) {
  process.stderr.write(`${message}
`);
  return 2;
}
function hasUnknownOption(args) {
  return args.find((item) => item.startsWith("--"));
}
function writeOsResult(payload, json, textFormatter, status = 0) {
  if (json) process.stdout.write(`${JSON.stringify(payload, null, 2)}
`);
  else process.stdout.write(textFormatter(payload));
  return status;
}
function failOsResult(command, error, json) {
  return writeOsResult({ ok: false, command, error }, json, (payload) => `${payload.error}
`, 1);
}
function splitCommandArgs(argv) {
  const marker = argv.indexOf("--");
  if (marker === -1) return { options: argv, command: [] };
  return {
    options: argv.slice(0, marker),
    command: argv.slice(marker + 1)
  };
}
function globToRegExp(glob) {
  const escaped = String(glob).replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`, "i");
}
async function walkFind(root, dir, regex, matches, limit) {
  if (matches.length >= limit) return;
  let entries;
  try {
    entries = await readdir9(dir, { withFileTypes: true });
  } catch {
    return;
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (matches.length >= limit) return;
    if (shouldSkipFindEntry(entry.name)) continue;
    const full = join19(dir, entry.name);
    const rel = relative10(root, full).replaceAll("\\", "/");
    const type = entry.isDirectory() ? "dir" : entry.isFile() ? "file" : "other";
    if (regex.test(entry.name) || regex.test(rel)) matches.push({ path: rel, type });
    if (entry.isDirectory()) await walkFind(root, full, regex, matches, limit);
  }
}
function shouldSkipFindEntry(name) {
  return (/* @__PURE__ */ new Set([".git", ".codegraph", "node_modules", ".worktrees", "dist", "artifacts"])).has(name);
}
function isUrlLike(value) {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value) || /^mailto:/i.test(value);
}
function platformOpenCommand(target) {
  if (process.platform === "win32") {
    return { command: "powershell.exe", args: ["-NoProfile", "-Command", "Start-Process", "-FilePath", target] };
  }
  if (process.platform === "darwin") return { command: "open", args: [target] };
  return { command: "xdg-open", args: [target] };
}
function runProcess(command, args, options = {}) {
  return new Promise((resolveProcess) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? process.cwd(),
      shell: false,
      windowsHide: true
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const limit = 2e5;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, options.timeoutMs ?? 3e4);
    child.stdout?.on("data", (chunk) => {
      stdout = (stdout + chunk.toString()).slice(-limit);
    });
    child.stderr?.on("data", (chunk) => {
      stderr = (stderr + chunk.toString()).slice(-limit);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      resolveProcess({ status: 127, stdout, stderr: error.message, timedOut });
    });
    child.on("close", (status, signal) => {
      clearTimeout(timer);
      resolveProcess({ status: status ?? 1, signal, stdout, stderr, timedOut });
    });
  });
}
async function directorySize(path) {
  let info;
  try {
    info = await stat3(path);
  } catch {
    return 0;
  }
  if (!info.isDirectory()) return info.size;
  let total = 0;
  let entries;
  try {
    entries = await readdir9(path, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const entry of entries) {
    total += await directorySize(join19(path, entry.name));
  }
  return total;
}
if (process.argv[1]) {
  let sameEntry = false;
  try {
    sameEntry = realpathSync(process.argv[1]) === realpathSync(modulePath2);
  } catch {
    sameEntry = resolve17(process.argv[1]) === modulePath2;
  }
  if (sameEntry) {
    process.exitCode = await main();
  }
}
export {
  enforcePolicy,
  exportPortableSkill,
  main
};
