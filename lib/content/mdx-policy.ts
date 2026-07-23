type EstreeNode = {
  type?: string;
  body?: EstreeNode[];
  expression?: EstreeNode;
  properties?: EstreeNode[];
  key?: EstreeNode;
  value?: EstreeNode | string | number | boolean | null;
  name?: string;
  computed?: boolean;
  method?: boolean;
  shorthand?: boolean;
};

type MdxAttribute = {
  type: string;
  name?: string;
  value?: string | null | {
    type?: string;
    data?: { estree?: EstreeNode };
  };
};

type MdxNode = {
  type: string;
  name?: string | null;
  attributes?: MdxAttribute[];
  children?: MdxNode[];
};

const BLOG_ASSET_PREFIX = "/assets/blog/";

function reject(detail: string): never {
  throw new Error(`MDX ${detail} is not allowed in trusted repository posts`);
}

function requireBlogAsset(value: unknown, component: string): asserts value is string {
  if (
    typeof value !== "string" ||
    !value.startsWith(BLOG_ASSET_PREFIX) ||
    value.startsWith("//")
  ) {
    reject(`${component} sources outside ${BLOG_ASSET_PREFIX}`);
  }
}

function validateArticleImage(node: MdxNode) {
  const attributes = node.attributes ?? [];
  const allowed = new Set(["src", "alt", "title"]);
  const values = new Map<string, string>();

  for (const attribute of attributes) {
    if (
      attribute.type !== "mdxJsxAttribute" ||
      !attribute.name ||
      !allowed.has(attribute.name) ||
      typeof attribute.value !== "string" ||
      values.has(attribute.name)
    ) {
      reject("ArticleImage attributes other than literal src, alt, and title");
    }
    values.set(attribute.name, attribute.value);
  }

  requireBlogAsset(values.get("src"), "ArticleImage");
  if (!values.get("alt")?.trim()) reject("ArticleImage without literal alt text");
  if (node.children?.length) reject("children inside ArticleImage");
}

function literalDescriptor(attribute: MdxAttribute, side: string) {
  if (
    attribute.type !== "mdxJsxAttribute" ||
    attribute.name !== side ||
    typeof attribute.value !== "object" ||
    attribute.value === null ||
    attribute.value.type !== "mdxJsxAttributeValueExpression"
  ) {
    reject(`ImagePair ${side} descriptors that are not object literals`);
  }

  const program = attribute.value.data?.estree;
  const statement = program?.body?.[0];
  const object = statement?.expression;
  if (
    program?.body?.length !== 1 ||
    statement?.type !== "ExpressionStatement" ||
    object?.type !== "ObjectExpression"
  ) {
    reject(`ImagePair ${side} descriptors that are not object literals`);
  }

  const allowed = new Set(["src", "alt", "caption"]);
  const values = new Map<string, string>();
  for (const property of object.properties ?? []) {
    const key = property.key?.name;
    const value = property.value;
    if (
      property.type !== "Property" ||
      property.computed ||
      property.method ||
      property.shorthand ||
      property.key?.type !== "Identifier" ||
      !key ||
      !allowed.has(key) ||
      values.has(key) ||
      typeof value !== "object" ||
      value === null ||
      value.type !== "Literal" ||
      typeof value.value !== "string"
    ) {
      reject(`ImagePair ${side} descriptor values that are not approved literals`);
    }
    values.set(key, value.value);
  }

  requireBlogAsset(values.get("src"), `ImagePair ${side}`);
  if (!values.get("alt")?.trim()) reject(`ImagePair ${side} without literal alt text`);
}

function validateImagePair(node: MdxNode) {
  const attributes = node.attributes ?? [];
  if (
    attributes.length !== 2 ||
    attributes[0]?.name !== "left" ||
    attributes[1]?.name !== "right"
  ) {
    reject("ImagePair attributes other than ordered left and right descriptors");
  }
  literalDescriptor(attributes[0], "left");
  literalDescriptor(attributes[1], "right");
  if (node.children?.length) reject("children inside ImagePair");
}

function validateNode(node: MdxNode) {
  if (node.type === "mdxjsEsm") reject("imports or exports");
  if (node.type === "mdxFlowExpression" || node.type === "mdxTextExpression") {
    reject("free JavaScript expressions");
  }
  if (node.type === "image" || node.type === "imageReference") {
    reject("Markdown images; use ArticleImage");
  }
  if (node.type === "html") reject("raw HTML");
  if (node.type === "mdxJsxTextElement") reject("inline JSX");

  if (node.type === "mdxJsxFlowElement") {
    if (node.name === "ArticleImage") validateArticleImage(node);
    else if (node.name === "ImagePair") validateImagePair(node);
    else reject(`component <${node.name ?? "unknown"}>`);
  }

  for (const child of node.children ?? []) validateNode(child);
}

/**
 * Repository posts are trusted author input, not arbitrary remote MDX. This
 * allowlist still blocks executable MDX and limits JSX to two media components.
 */
export function enforceTrustedMdxPolicy() {
  return (tree: MdxNode) => validateNode(tree);
}
