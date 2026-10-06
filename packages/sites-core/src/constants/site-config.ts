export const SITE_HEX_COLOR = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
/** A site path, an http(s) URL or a mailto: link. */
export const SITE_LINK_HREF = /^(?:\/(?!\/)|https?:\/\/|mailto:)/;
/** A Lucide icon name (`book-open`); unknown names render no icon. */
export const SITE_ICON_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** An author's id in notra.json, used as `author: jan` in a post's frontmatter. */
export const SITE_AUTHOR_ID = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
export const SITE_DEFAULT_PRIMARY_COLOR = "#8B5CF6";
