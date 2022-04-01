<script lang="ts">
  import prettier from "prettier/standalone";
  import pluginHtml from "prettier/parser-html";
  import pluginBabel from "prettier/parser-babel";
  import pluginCSS from "prettier/parser-postcss";
  import * as pluginGoTemplate from "prettier-plugin-go-template";

  let input = "";
  let output = "";

  function onInput(event) {
    try {
      output = prettier.format(event.target.value, {
        parser: "go-template",
        plugins: [pluginHtml, pluginBabel, pluginCSS, pluginGoTemplate],
      });
    } catch (e) {
      output = e.toString();
    }
  }
</script>

<main>
  <textarea bind:value={input} on:input={onInput} />
  <div class="divider" />
  <textarea bind:value={output} class="output-only" disabled />
</main>

<style>
  .output-only {
    pointer-events: none;
  }
  .divider {
    width: 1px;
    background-color: darkgray;
  }
  textarea {
    outline: none;
    border-radius: 0;
    flex-grow: 1;
    font-family: monospace;
    white-space: pre-wrap;
  }
  main {
    display: flex;
    justify-items: stretch;
    height: 100%;
    width: 100%;
  }
</style>
