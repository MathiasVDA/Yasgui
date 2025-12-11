/**
 * Make sure not to include any deps from our main index file. That way, we can easily publish the plugin as standalone build
 */
import "./index.scss";
import "datatables.net-dt/css/dataTables.dataTables.min.css";
import "datatables.net-buttons-dt/css/buttons.dataTables.min.css";
import "datatables.net-fixedheader-dt/css/fixedHeader.dataTables.min.css";
import "datatables.net-scroller-dt/css/scroller.dataTables.min.css";
import "datatables.net-columncontrol-dt/css/columnControl.dataTables.min.css";
import "datatables.net";
import "datatables.net-buttons";
import "datatables.net-buttons/js/buttons.html5.mjs";
import "datatables.net-buttons/js/buttons.colVis.mjs";
import "datatables.net-fixedheader";
import "datatables.net-scroller";
import "datatables.net-columncontrol";
//@ts-ignore (jquery _does_ expose a default. In es6, it's the one we should use)
import $ from "jquery";
import Parser from "../../parsers";
import { escape } from "lodash-es";
import { Plugin, DownloadInfo } from "../";
import Yasr from "../../";
import { drawSvgStringAsElement, drawFontAwesomeIconAsSvg, addClass, removeClass } from "@matdata/yasgui-utils";
import * as faTableIcon from "@fortawesome/free-solid-svg-icons/faTable";
import { DeepReadonly } from "ts-essentials";
import { cloneDeep } from "lodash-es";
import sanitize from "../../helpers/sanitize";

import ColumnResizer from "column-resizer";

export interface PluginConfig {
  openIriInNewWindow: boolean;
  // Using any to avoid TypeScript 5.x stack overflow with DataTables 2.3+ complex recursive extension types
  // The Config type from datatables.net combined with buttons, scroller, searchPanes, etc. causes circular type resolution
  // JavaScript build and runtime work correctly - this is only a TypeScript compiler limitation
  tableConfig: any;
}

export interface PersistentConfig {
  pageSize?: number;
  compact?: boolean;
  isCompactView?: boolean;
  showUriPrefixes?: boolean;
  showDatatypes?: boolean;
}

type DataRow = [number, ...(Parser.BindingValue | "")[]];

function expand(this: HTMLDivElement, event: MouseEvent) {
  addClass(this, "expanded");
  event.preventDefault();
}

export default class Table implements Plugin<PluginConfig> {
  private config: DeepReadonly<PluginConfig>;
  private persistentConfig: PersistentConfig = {};
  private yasr: Yasr;
  private tableControls: Element | undefined;
  private tableEl: HTMLTableElement | undefined;
  private dataTable: any; // DataTables Api type
  private tableFilterField: HTMLInputElement | undefined;
  private tableCompactSwitch: HTMLInputElement | undefined;
  private tableCompactViewSwitch: HTMLInputElement | undefined;
  private tableUriPrefixSwitch: HTMLInputElement | undefined;
  private tableDatatypeSwitch: HTMLInputElement | undefined;
  private tableResizer:
    | {
        reset: (options: {
          disable: boolean;
          onResize?: () => void;
          partialRefresh?: boolean;
          headerOnly?: boolean;
        }) => void;
        onResize: () => void;
      }
    | undefined;
  public helpReference = "https://yasgui-doc.matdata.eu/docs/user-guide#table-plugin";
  public label = "Table";
  public priority = 10;
  public getIcon() {
    return drawSvgStringAsElement(drawFontAwesomeIconAsSvg(faTableIcon));
  }
  constructor(yasr: Yasr) {
    this.yasr = yasr;
    //TODO read options from constructor
    this.config = Table.defaults;
  }
  public static defaults: PluginConfig = {
    openIriInNewWindow: true,
    tableConfig: {
      layout: {
        top: null,
        topStart: null,
        topEnd: null,
        bottom: null,
        bottomStart: null,
        bottomEnd: null,
      },
      // Use scroller with pagination enabled (required by Scroller)
      scrollY: "400px",
      scroller: {
        loadingIndicator: true,
      },
      deferRender: true,
      // Pagination required by Scroller, but with large page size
      paging: true,
      pageLength: 10000,
      data: [],
      columns: [],
      order: [],
      orderClasses: false,
      // Configure column control
      columnControl: ["order", ["searchList"]],
      ordering: {
        indicators: false,
        handler: false,
      },
    },
  };
  private getRows(): DataRow[] {
    if (!this.yasr.results) return [];
    const bindings = this.yasr.results.getBindings();
    if (!bindings) return [];
    // Vars decide the columns
    const vars = this.yasr.results.getVariables();
    // Use "" as the empty value, undefined will throw runtime errors
    return bindings.map((binding, rowId) => [rowId + 1, ...vars.map((variable) => binding[variable] ?? "")]);
  }

  private getMarkdownTable(): string {
    if (!this.yasr.results) return "";
    const bindings = this.yasr.results.getBindings();
    if (!bindings) return "";
    const vars = this.yasr.results.getVariables();

    // Helper to escape special characters in markdown (backslashes and pipes)
    const escapeMarkdown = (str: string) => str.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");

    // Helper to get plain text value from binding
    const getPlainValue = (binding: Parser.BindingValue | ""): string => {
      if (binding === "") return "";
      return escapeMarkdown(binding.value);
    };

    // Create header row
    let markdown = "| " + vars.map(escapeMarkdown).join(" | ") + " |\n";
    // Create separator row
    markdown += "| " + vars.map(() => "---").join(" | ") + " |\n";
    // Create data rows
    bindings.forEach((binding) => {
      const row = vars.map((variable) => getPlainValue(binding[variable] ?? ""));
      markdown += "| " + row.join(" | ") + " |\n";
    });

    return markdown;
  }

  private getTabDelimitedTable(dt: any): string {
    if (!this.yasr.results) return "";
    const vars = this.yasr.results.getVariables();
    const bindings = this.yasr.results.getBindings();
    if (!bindings) return "";

    // Get visible columns from DataTable
    const visibleColumns = dt.columns(":visible").indexes().toArray();
    const visibleVars = visibleColumns
      .filter((idx: number) => idx > 0) // Skip row number column
      .map((idx: number) => vars[idx - 1]); // Adjust for row number column

    // Create header row
    let output = visibleVars.join("\t") + "\n";

    // Create data rows
    bindings.forEach((binding) => {
      const row = visibleVars.map((variable: string) => {
        const value = binding[variable];
        return value ? value.value : "";
      });
      output += row.join("\t") + "\n";
    });

    return output;
  }

  private async copyTabDelimited(dt: any) {
    const tabDelimited = this.getTabDelimitedTable(dt);
    try {
      await navigator.clipboard.writeText(tabDelimited);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  private getUriLinkFromBinding(binding: Parser.BindingValue, prefixes?: { [key: string]: string }) {
    const href = sanitize(binding.value);
    let visibleString = href;
    let prefixed = false;
    // Apply URI prefixing if enabled (default true)
    if (this.persistentConfig.showUriPrefixes !== false && prefixes) {
      for (const prefixLabel in prefixes) {
        if (visibleString.indexOf(prefixes[prefixLabel]) == 0) {
          visibleString = prefixLabel + ":" + href.substring(prefixes[prefixLabel].length);
          prefixed = true;
          break;
        }
      }
    }
    // Hide brackets when prefixed or compact
    const hideBrackets = prefixed || this.persistentConfig.compact;
    const uri = `${hideBrackets ? "" : "&lt;"}<a class='iri' target='${
      this.config.openIriInNewWindow ? "_blank" : "_self"
    }'${this.config.openIriInNewWindow ? " ref='noopener noreferrer'" : ""} href='${href}'>${sanitize(
      visibleString,
    )}</a>${hideBrackets ? "" : "&gt;"}`;
    return sanitize(uri);
  }
  private getCellContent(binding: Parser.BindingValue, prefixes?: { [label: string]: string }): string {
    let content: string;
    if (binding.type == "uri") {
      content = `<span>${this.getUriLinkFromBinding(binding, prefixes)}</span>`;
    } else {
      content = `<span class='nonIri'>${this.formatLiteral(binding, prefixes)}</span>`;
    }

    return `<div>${content}</div>`;
  }
  private formatLiteral(literalBinding: Parser.BindingValue, prefixes?: { [key: string]: string }) {
    let stringRepresentation = sanitize(escape(literalBinding.value));
    // Return now when in compact mode.
    if (this.persistentConfig.compact) return stringRepresentation;

    // Show datatypes if enabled (default true)
    if (this.persistentConfig.showDatatypes !== false) {
      if (literalBinding["xml:lang"]) {
        stringRepresentation = `"${stringRepresentation}"<sup>@${literalBinding["xml:lang"]}</sup>`;
      } else if (literalBinding.datatype) {
        const dataType = this.getUriLinkFromBinding({ type: "uri", value: literalBinding.datatype }, prefixes);
        stringRepresentation = `"${stringRepresentation}"<sup>^^${dataType}</sup>`;
      }
    }
    return stringRepresentation;
  }

  private getColumns(): any[] {
    // DataTables ConfigColumns type
    if (!this.yasr.results) return [];
    const prefixes = this.yasr.getPrefixes();

    return [
      {
        name: "",
        searchable: false,
        width: `${this.getSizeFirstColumn()}px`,
        type: "num",
        orderable: false,
        visible: this.persistentConfig.compact !== true,
        render: (data: number, type: any) =>
          type === "filter" || type === "sort" || !type ? data : `<div class="rowNumber">${data}</div>`,
      }, //prepend with row numbers column
      ...this.yasr.results?.getVariables().map((name) => {
        return {
          name,
          title: sanitize(name),
          render: (data: Parser.BindingValue | "", type: any, _row: any, _meta: any) => {
            // Handle empty rows
            if (data === "") return data;
            if (type === "filter" || type === "sort" || !type) return sanitize(data.value);
            return this.getCellContent(data, prefixes);
          },
        };
      }),
    ];
  }
  private getSizeFirstColumn() {
    const numResults = this.yasr.results?.getBindings()?.length || 0;
    return numResults.toString().length * 8;
  }

  public draw(persistentConfig: PersistentConfig) {
    this.persistentConfig = { ...this.persistentConfig, ...persistentConfig };
    this.tableEl = document.createElement("table");
    const rows = this.getRows();
    const columns = this.getColumns();

    if (this.dataTable) {
      this.destroyResizer();

      this.dataTable.destroy(true);
      this.dataTable = undefined;
    }
    this.yasr.resultsEl.appendChild(this.tableEl);

    // Configure extensions based on simple view setting
    const isSimpleView = this.persistentConfig.compact === true;

    // Reset some default config properties as they couldn't be initialized beforehand
    // Using any type here to match tableConfig type (see PluginConfig interface for explanation)
    const dtConfig: any = {
      ...cloneDeep(this.config.tableConfig),
      data: rows,
      columns: columns,
      // Disable extensions in simple view
      fixedHeader: !isSimpleView,
      colReorder: !isSimpleView,
      columnControl: !isSimpleView ? ["order", ["searchList"]] : false,
    };
    this.dataTable = $(this.tableEl).DataTable(dtConfig);
    this.tableEl.style.removeProperty("width");
    this.tableEl.style.width = this.tableEl.clientWidth + "px";
    const widths = Array.from(this.tableEl.querySelectorAll("th")).map((h) => h.offsetWidth - 26);
    this.tableResizer = new ColumnResizer(this.tableEl, {
      widths: this.persistentConfig.compact === true ? widths : [this.getSizeFirstColumn(), ...widths.slice(1)],
      partialRefresh: true,
      onResize: this.persistentConfig.isCompactView !== false && this.setEllipsisHandlers,
      headerOnly: true,
    });
    // DataTables uses the rendered style to decide the widths of columns.
    // Before a draw remove the compactTable styling
    if (this.persistentConfig.isCompactView !== false) {
      this.dataTable?.on("preDraw", () => {
        this.tableResizer?.reset({ disable: true });
        removeClass(this.tableEl, "compactTable");
        this.tableEl?.style.removeProperty("width");
        this.tableEl?.style.setProperty("width", this.tableEl.clientWidth + "px");
        return true; // Indicate it should re-render
      });
      // After a draw
      this.dataTable?.on("draw", () => {
        if (!this.tableEl) return;
        // Width of table after render, removing width will make it fall back to 100%
        let targetSize = this.tableEl.clientWidth;
        this.tableEl.style.removeProperty("width");
        // Let's make sure the new size is not bigger
        if (targetSize > this.tableEl.clientWidth) targetSize = this.tableEl.clientWidth;
        this.tableEl?.style.setProperty("width", `${targetSize}px`);
        // Enable the re-sizer
        this.tableResizer?.reset({
          disable: false,
          partialRefresh: true,
          onResize: this.setEllipsisHandlers,
          headerOnly: true,
        });
        // Re-add the compact styling
        addClass(this.tableEl, "compactTable");
        // Check if cells need the ellipsisHandlers
        this.setEllipsisHandlers();
      });
    }

    this.drawControls();
    // Draw again but with the events
    if (this.persistentConfig.isCompactView !== false) {
      addClass(this.tableEl, "compactTable");
      this.setEllipsisHandlers();
    }
  }

  private setEllipsisHandlers = () => {
    this.dataTable?.cells({ page: "current" }).every((rowIdx: any, colIdx: any) => {
      const cell = this.dataTable?.cell(rowIdx, colIdx);
      if (cell?.data() === "") return;
      const cellNode = cell?.node() as HTMLTableCellElement;
      if (cellNode) {
        const content = cellNode.firstChild as HTMLDivElement;
        if ((content.firstElementChild?.getBoundingClientRect().width || 0) > content.getBoundingClientRect().width) {
          if (!content.classList.contains("expandable")) {
            addClass(content, "expandable");
            content.addEventListener("click", expand, { once: true });
          }
        } else {
          if (content.classList.contains("expandable")) {
            removeClass(content, "expandable");
            content.removeEventListener("click", expand);
          }
        }
      }
    });
  };
  private handleTableSearch = (event: KeyboardEvent) => {
    // Using draw() without parameters since we're using scroller instead of pagination
    this.dataTable?.search((event.target as HTMLInputElement).value).draw();
  };
  private handleSetCompactToggle = (event: Event) => {
    // Store in persistentConfig
    this.persistentConfig.compact = (event.target as HTMLInputElement).checked;
    // Update the table
    this.draw(this.persistentConfig);
    this.yasr.storePluginConfig("table", this.persistentConfig);
  };
  private handleSetCompactViewToggle = (event: Event) => {
    // Store in persistentConfig
    this.persistentConfig.isCompactView = (event.target as HTMLInputElement).checked;
    // Update the table
    this.draw(this.persistentConfig);
    this.yasr.storePluginConfig("table", this.persistentConfig);
  };
  private handleSetUriPrefixToggle = (event: Event) => {
    // Store in persistentConfig
    this.persistentConfig.showUriPrefixes = (event.target as HTMLInputElement).checked;
    // Update the table
    this.draw(this.persistentConfig);
    this.yasr.storePluginConfig("table", this.persistentConfig);
  };
  private handleSetDatatypeToggle = (event: Event) => {
    // Store in persistentConfig
    this.persistentConfig.showDatatypes = (event.target as HTMLInputElement).checked;
    // Update the table
    this.draw(this.persistentConfig);
    this.yasr.storePluginConfig("table", this.persistentConfig);
  };
  private handleCopyMarkdown = async () => {
    const markdown = this.getMarkdownTable();
    try {
      await navigator.clipboard.writeText(markdown);
    } catch (err) {
      console.error("Failed to copy markdown:", err);
    }
  };
  /**
   * Draws controls on each update
   */
  drawControls() {
    // Remove old header
    this.removeControls();
    this.tableControls = document.createElement("div");
    this.tableControls.className = "tableControls";

    // Compact switch
    const toggleWrapper = document.createElement("div");
    const switchComponent = document.createElement("label");
    const textComponent = document.createElement("span");
    textComponent.innerText = "Simple view";
    addClass(textComponent, "label");
    switchComponent.appendChild(textComponent);
    addClass(switchComponent, "switch");
    toggleWrapper.appendChild(switchComponent);
    this.tableCompactSwitch = document.createElement("input");
    switchComponent.addEventListener("change", this.handleSetCompactToggle);
    this.tableCompactSwitch.type = "checkbox";
    switchComponent.appendChild(this.tableCompactSwitch);
    this.tableCompactSwitch.defaultChecked = !!this.persistentConfig.compact;
    this.tableControls.appendChild(toggleWrapper);

    // Compact view switch
    const compactViewToggleWrapper = document.createElement("div");
    const compactViewSwitchComponent = document.createElement("label");
    const compactViewTextComponent = document.createElement("span");
    compactViewTextComponent.innerText = "Compact";
    addClass(compactViewTextComponent, "label");
    compactViewSwitchComponent.appendChild(compactViewTextComponent);
    addClass(compactViewSwitchComponent, "switch");
    compactViewToggleWrapper.appendChild(compactViewSwitchComponent);
    this.tableCompactViewSwitch = document.createElement("input");
    compactViewSwitchComponent.addEventListener("change", this.handleSetCompactViewToggle);
    this.tableCompactViewSwitch.type = "checkbox";
    compactViewSwitchComponent.appendChild(this.tableCompactViewSwitch);
    this.tableCompactViewSwitch.defaultChecked = this.persistentConfig.isCompactView !== false;
    this.tableControls.appendChild(compactViewToggleWrapper);

    // URI Prefix switch
    const uriPrefixToggleWrapper = document.createElement("div");
    const uriPrefixSwitchComponent = document.createElement("label");
    const uriPrefixTextComponent = document.createElement("span");
    uriPrefixTextComponent.innerText = "Prefixes";
    addClass(uriPrefixTextComponent, "label");
    uriPrefixSwitchComponent.appendChild(uriPrefixTextComponent);
    addClass(uriPrefixSwitchComponent, "switch");
    uriPrefixToggleWrapper.appendChild(uriPrefixSwitchComponent);
    this.tableUriPrefixSwitch = document.createElement("input");
    uriPrefixSwitchComponent.addEventListener("change", this.handleSetUriPrefixToggle);
    this.tableUriPrefixSwitch.type = "checkbox";
    uriPrefixSwitchComponent.appendChild(this.tableUriPrefixSwitch);
    this.tableUriPrefixSwitch.defaultChecked = this.persistentConfig.showUriPrefixes !== false;
    this.tableControls.appendChild(uriPrefixToggleWrapper);

    // Datatype switch
    const datatypeToggleWrapper = document.createElement("div");
    const datatypeSwitchComponent = document.createElement("label");
    const datatypeTextComponent = document.createElement("span");
    datatypeTextComponent.innerText = "Datatypes";
    addClass(datatypeTextComponent, "label");
    datatypeSwitchComponent.appendChild(datatypeTextComponent);
    addClass(datatypeSwitchComponent, "switch");
    datatypeToggleWrapper.appendChild(datatypeSwitchComponent);
    this.tableDatatypeSwitch = document.createElement("input");
    datatypeSwitchComponent.addEventListener("change", this.handleSetDatatypeToggle);
    this.tableDatatypeSwitch.type = "checkbox";
    datatypeSwitchComponent.appendChild(this.tableDatatypeSwitch);
    this.tableDatatypeSwitch.defaultChecked = this.persistentConfig.showDatatypes !== false;
    this.tableControls.appendChild(datatypeToggleWrapper);

    // Create table filter
    this.tableFilterField = document.createElement("input");
    this.tableFilterField.className = "tableFilter";
    this.tableFilterField.placeholder = "Filter query results";
    this.tableFilterField.setAttribute("aria-label", "Filter query results");
    this.tableControls.appendChild(this.tableFilterField);
    this.tableFilterField.addEventListener("keyup", this.handleTableSearch);

    // Create copy button with dropdown
    const copyButton = document.createElement("div");
    copyButton.className = "copyButtonWrapper";
    copyButton.style.position = "relative";
    copyButton.style.display = "inline-block";

    const copyMainBtn = document.createElement("button");
    copyMainBtn.className = "copyMarkdownBtn";
    copyMainBtn.textContent = "Copy";
    copyMainBtn.setAttribute("aria-label", "Copy table data");

    const copyDropdown = document.createElement("div");
    copyDropdown.className = "copyDropdown";
    copyDropdown.style.display = "none";
    copyDropdown.style.position = "absolute";
    copyDropdown.style.backgroundColor = "var(--yasgui-bg-primary, #fff)";
    copyDropdown.style.border = "1px solid var(--yasgui-border-color, #ddd)";
    copyDropdown.style.borderRadius = "3px";
    copyDropdown.style.zIndex = "1000";
    copyDropdown.style.minWidth = "150px";

    const tabDelimitedOption = document.createElement("button");
    tabDelimitedOption.className = "copyOption";
    tabDelimitedOption.textContent = "Tab-delimited";
    tabDelimitedOption.style.display = "block";
    tabDelimitedOption.style.width = "100%";
    tabDelimitedOption.style.padding = "8px 12px";
    tabDelimitedOption.style.border = "none";
    tabDelimitedOption.style.background = "none";
    tabDelimitedOption.style.textAlign = "left";
    tabDelimitedOption.style.cursor = "pointer";
    tabDelimitedOption.onclick = () => {
      this.copyTabDelimited(this.dataTable);
      copyDropdown.style.display = "none";
    };

    const markdownOption = document.createElement("button");
    markdownOption.className = "copyOption";
    markdownOption.textContent = "Markdown";
    markdownOption.style.display = "block";
    markdownOption.style.width = "100%";
    markdownOption.style.padding = "8px 12px";
    markdownOption.style.border = "none";
    markdownOption.style.background = "none";
    markdownOption.style.textAlign = "left";
    markdownOption.style.cursor = "pointer";
    markdownOption.onclick = () => {
      this.handleCopyMarkdown();
      copyDropdown.style.display = "none";
    };

    copyDropdown.appendChild(tabDelimitedOption);
    copyDropdown.appendChild(markdownOption);

    copyMainBtn.onclick = () => {
      copyDropdown.style.display = copyDropdown.style.display === "none" ? "block" : "none";
    };

    copyButton.appendChild(copyMainBtn);
    copyButton.appendChild(copyDropdown);
    this.tableControls.appendChild(copyButton);

    this.yasr.pluginControls.appendChild(this.tableControls);
  }
  download(filename?: string) {
    return {
      getData: () => this.yasr.results?.asCsv() || "",
      contentType: "text/csv",
      title: "Download result",
      filename: `${filename || "queryResults"}.csv`,
    } as DownloadInfo;
  }

  public canHandleResults() {
    return !!this.yasr.results && this.yasr.results.getVariables() && this.yasr.results.getVariables().length > 0;
  }
  private removeControls() {
    // Unregister listeners and remove references to old fields
    this.tableFilterField?.removeEventListener("keyup", this.handleTableSearch);
    this.tableFilterField = undefined;
    this.tableCompactSwitch?.removeEventListener("change", this.handleSetCompactToggle);
    this.tableCompactSwitch = undefined;
    this.tableCompactViewSwitch?.removeEventListener("change", this.handleSetCompactViewToggle);
    this.tableCompactViewSwitch = undefined;
    this.tableUriPrefixSwitch?.removeEventListener("change", this.handleSetUriPrefixToggle);
    this.tableUriPrefixSwitch = undefined;
    this.tableDatatypeSwitch?.removeEventListener("change", this.handleSetDatatypeToggle);
    this.tableDatatypeSwitch = undefined;
    // Empty controls
    while (this.tableControls?.firstChild) this.tableControls.firstChild.remove();
    this.tableControls?.remove();
  }
  private destroyResizer() {
    if (this.tableResizer) {
      this.tableResizer.reset({ disable: true });
      window.removeEventListener("resize", this.tableResizer.onResize);
      this.tableResizer = undefined;
    }
  }
  destroy() {
    this.removeControls();
    this.destroyResizer();
    // According to datatables docs, destroy(true) will also remove all events
    this.dataTable?.destroy(true);
    this.dataTable = undefined;
  }
}
