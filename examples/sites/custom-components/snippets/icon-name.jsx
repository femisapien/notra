// A copyable icon name. Use it with client:static: React renders the HTML at
// build time and ships no JavaScript, and script.js handles the click.
export const IconName = ({ name }) => (
  <button type="button" className="pm-icon-name" data-copy={name} title={`Copy ${name}`}>
    {name}
  </button>
);
