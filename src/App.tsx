import { useEffect, useRef, useState } from "react";
import {
  Circle,
  Eye,
  Palette,
  ScanLine,
  Layers,
  Shuffle,
  RotateCcw,
  Plus,
  Download,
  ArrowDown,
  Check,
  Trash2,
  X,
  ArrowUpRight,
  Move,
  FolderHeart,
  Globe,
  ChevronRight,
  CheckCheck,
  LoaderCircle,
} from "lucide-react";
import Icon from "./Icon";
import { copy } from "./i18n";
import {
  DEFAULT,
  KEY,
  shapes,
  eyes,
  palette,
  changeConfig,
  randomConfig,
  fitPosition,
  fingerprint,
  parseCollection,
  type Lang,
  type Config,
  type Candidate,
} from "./model";
import {
  downloadIcon,
  collectionZip,
  saveBlob,
  type ExportFormat,
} from "./export";
type Tab = "shape" | "eyes" | "color" | "outline" | "background";
const tabs = [
  { id: "shape", icon: Circle },
  { id: "eyes", icon: Eye },
  { id: "color", icon: Palette },
  { id: "outline", icon: ScanLine },
  { id: "background", icon: Layers },
] as const;
function readSaved() {
  try {
    const raw = localStorage.getItem(KEY);
    const items = parseCollection(raw);
    return {
      items,
      error: raw !== null && JSON.parse(raw).length !== items.length,
    };
  } catch {
    return { items: [] as Candidate[], error: true };
  }
}
function firstLang(): Lang {
  try {
    return localStorage.getItem("grok-bot-lang") === "ko" ? "ko" : "en";
  } catch {
    return "en";
  }
}
export default function App() {
  const [lang, setLang] = useState<Lang>(firstLang),
    [tab, setTab] = useState<Tab>("shape");
  const [config, setConfig] = useState<Config>(DEFAULT),
    [initial] = useState(readSaved),
    [items, setItems] = useState<Candidate[]>(initial.items);
  const [editing, setEditing] = useState<string | null>(null),
    [notice, setNotice] = useState<keyof typeof copy.en | null>(null);
  const [storageError, setStorageError] = useState(false),
    [confirm, setConfirm] = useState(false),
    [format, setFormat] = useState<ExportFormat>("png");
  const [busy, setBusy] = useState(false),
    [progress, setProgress] = useState<number | null>(null);
  const dirty = useRef(false),
    dialog = useRef<HTMLDialogElement>(null),
    busyRef = useRef(false);
  const t = copy[lang];
  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem("grok-bot-lang", lang);
    } catch {
      /* Preferences are optional. */
    }
  }, [lang]);
  useEffect(() => {
    if (!dirty.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [items]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (confirm) dialog.current?.showModal();
    else if (dialog.current?.open) dialog.current.close();
  }, [confirm]);
  function mutate(next: Candidate[]) {
    dirty.current = true;
    setItems(next);
  }
  function patch(value: Partial<Config>) {
    setConfig((c) => changeConfig(c, value));
  }
  function add() {
    if (items.some((c) => fingerprint(c.config) === fingerprint(config))) {
      setNotice("duplicate");
      return;
    }
    mutate([
      ...items,
      { id: crypto.randomUUID(), config: structuredClone(config) },
    ]);
    setNotice("added");
  }
  function update() {
    if (!editing) return;
    if (
      items.some(
        (c) =>
          c.id !== editing && fingerprint(c.config) === fingerprint(config),
      )
    ) {
      setNotice("duplicate");
      return;
    }
    mutate(
      items.map((c) =>
        c.id === editing ? { ...c, config: structuredClone(config) } : c,
      ),
    );
    setNotice("updated");
  }
  function remove(id: string) {
    mutate(items.filter((c) => c.id !== id));
    if (editing === id) setEditing(null);
    setNotice("removed");
  }
  function load(item: Candidate) {
    setConfig(structuredClone(item.config));
    setEditing(item.id);
    document
      .querySelector(".workspace")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function runExport(action: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await action();
      setNotice("downloaded");
    } catch {
      setNotice("exportError");
    } finally {
      busyRef.current = false;
      setBusy(false);
      setProgress(null);
    }
  }
  function exportAll() {
    const snapshot = structuredClone(items);
    void runExport(async () => {
      setProgress(0);
      const blob = await collectionZip(snapshot, format, setProgress);
      saveBlob(blob, "grok-bot-collection.zip");
    });
  }
  const sectionNote = {
    shape: t.shapeNote,
    eyes: t.eyesNote,
    color: t.colorNote,
    outline: t.outlineNote,
    background: t.backgroundNote,
  }[tab];
  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="./" aria-label="Grok Bot Icon Generator">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
          </span>
          <span>
            Grok Bot<span className="brand-secondary"> / Icon Generator</span>
          </span>
        </a>
        <div className="header-right">
          <div className="language" aria-label="Language / 언어">
            <Globe size={15} />
            <button aria-pressed={lang === "en"} onClick={() => setLang("en")}>
              EN
            </button>
            <span>/</span>
            <button aria-pressed={lang === "ko"} onClick={() => setLang("ko")}>
              KO
            </button>
          </div>
        </div>
      </header>
      <div className="editor-layout">
        <aside className="rail">
          <div className="rail-intro">
            <h1>{lang === "en" ? "Icon generator" : "아이콘 제너레이터"}</h1>
          </div>
          <nav aria-label={lang === "en" ? "Icon options" : "아이콘 옵션"}>
            {tabs.map(({ id, icon: Symbol }) => (
              <button
                key={id}
                className={`nav-item ${tab === id ? "active" : ""}`}
                onClick={() => setTab(id)}
                aria-current={tab === id ? "step" : undefined}
              >
                <Symbol size={19} strokeWidth={1.7} />
                <span>{t[id]}</span>
              </button>
            ))}
          </nav>
        </aside>
        <section className="options" aria-labelledby="options-title">
          <div className="options-heading">
            <div>
              <h2 id="options-title">{t[tab]}</h2>
            </div>
            <span className="option-count">
              {tab === "shape" ? (
                "13"
              ) : tab === "eyes" ? (
                "12"
              ) : tab === "color" ? (
                "11"
              ) : (
                <ArrowUpRight size={18} />
              )}
            </span>
          </div>
          <p className="section-note">{sectionNote}</p>
          {tab === "shape" && (
            <div className="option-grid" aria-label={t.shape}>
              {shapes.map((shape, i) => (
                <button
                  key={shape.id}
                  className={`option-card ${shape.id === config.shape ? "selected" : ""}`}
                  onClick={() => patch({ shape: shape.id })}
                  aria-label={shape[lang]}
                  aria-pressed={shape.id === config.shape}
                  title={shape[lang]}
                >
                  <svg viewBox="0 0 1024 1024" aria-hidden="true">
                    <path d={shape.d} fill={config.color} />
                  </svg>
                  <span className="tile-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {shape.id === config.shape && (
                    <span className="selected-mark">
                      <Check size={11} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          {tab === "eyes" && (
            <>
              <div className="option-grid" aria-label={t.eyes}>
                {eyes.map((eye, i) => (
                  <button
                    key={eye.id}
                    className={`option-card eyes-card ${eye.id === config.eyes ? "selected" : ""}`}
                    onClick={() => patch({ eyes: eye.id })}
                    aria-label={eye[lang]}
                    aria-pressed={eye.id === config.eyes}
                    title={eye[lang]}
                  >
                    <svg viewBox="-220 -220 440 440" aria-hidden="true">
                      <path d={eye.d} fill="black" />
                    </svg>
                    <span className="tile-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {eye.id === config.eyes && (
                      <span className="selected-mark">
                        <Check size={11} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="option-tip">
                <Move size={18} />
                <p>{t.keyboard}</p>
              </div>
              <button
                className="text-button"
                onClick={() =>
                  patch({ position: fitPosition(config, DEFAULT.position) })
                }
              >
                <RotateCcw size={14} />
                {t.centerEyes}
              </button>
            </>
          )}
          {tab === "color" && (
            <>
              <ColorPicker
                lang={lang}
                value={config.color}
                onChange={(color) => patch({ color })}
              />
              <div className="color-detail">
                <span
                  className="color-detail-dot"
                  style={{ background: config.color }}
                />
                <div>
                  <strong>
                    {palette.find((p) => p.hex === config.color)?.[lang]}
                  </strong>
                  <span>{config.color}</span>
                </div>
                <Check size={18} />
              </div>
            </>
          )}
          {tab === "outline" && (
            <div className="settings-stack">
              <div className="setting-row">
                <label htmlFor="outline-switch">{t.stroke}</label>
                <button
                  id="outline-switch"
                  className={`switch ${config.outline ? "checked" : ""}`}
                  role="switch"
                  aria-checked={config.outline}
                  onClick={() => patch({ outline: !config.outline })}
                >
                  <span />
                </button>
              </div>
              <div
                className={`thickness-control ${!config.outline ? "muted" : ""}`}
              >
                <div className="setting-row">
                  <label htmlFor="thickness">{t.thickness}</label>
                  <output htmlFor="thickness">{config.thickness} px</output>
                </div>
                <input
                  id="thickness"
                  type="range"
                  min="2"
                  max="24"
                  step="1"
                  value={config.thickness}
                  disabled={!config.outline}
                  onChange={(e) => patch({ thickness: Number(e.target.value) })}
                />
                <div className="range-labels">
                  <span>2 px</span>
                  <span>24 px</span>
                </div>
              </div>
              <fieldset className="outline-colors" disabled={!config.outline}>
                <legend>{t.outlineColor}</legend>
                <div className="outline-color-options">
                  {(["#000000", "#FFFFFF"] as const).map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-pressed={config.outlineColor === color}
                      className={
                        config.outlineColor === color ? "selected" : ""
                      }
                      onClick={() => patch({ outlineColor: color })}
                    >
                      <span
                        className="outline-swatch"
                        style={{ background: color }}
                      />
                      {color === "#000000" ? t.black : t.white}
                      {config.outlineColor === color && <Check size={13} />}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="outline-example">
                <svg viewBox="0 0 200 180" aria-hidden="true">
                  <circle
                    cx="100"
                    cy="90"
                    r="57"
                    fill={config.color}
                    stroke={config.outline ? config.outlineColor : "none"}
                    strokeWidth={config.thickness / 3}
                  />
                  <g fill="white" transform="rotate(-25 100 90)">
                    <rect x="82" y="70" width="10" height="28" rx="5" />
                    <rect x="105" y="70" width="10" height="28" rx="5" />
                  </g>
                </svg>
              </div>
            </div>
          )}
          {tab === "background" && (
            <>
              <div className="segmented">
                <button
                  className={config.background === null ? "active" : ""}
                  aria-pressed={config.background === null}
                  onClick={() => patch({ background: null })}
                >
                  <span className="transparent-swatch" />
                  {t.transparent}
                </button>
                <button
                  className={config.background !== null ? "active" : ""}
                  aria-pressed={config.background !== null}
                  onClick={() =>
                    patch({ background: config.background ?? "#000000" })
                  }
                >
                  <Circle size={15} />
                  {t.solid}
                </button>
              </div>
              {config.background !== null ? (
                <ColorPicker
                  lang={lang}
                  value={config.background}
                  onChange={(background) => patch({ background })}
                />
              ) : (
                <div className="transparency-demo checker">
                  <span>
                    <Layers size={28} />
                    {t.transparent}
                  </span>
                </div>
              )}
            </>
          )}
        </section>
        <main className="workspace">
          <section className="preview-section" aria-labelledby="preview-title">
            <div className="preview-heading">
              <div>
                <h2 id="preview-title">{t.preview}</h2>
              </div>
              <span className="size-badge">{t.size}</span>
            </div>
            {editing && (
              <div className="editing-bar">
                <span>
                  {t.editing} #
                  {String(
                    items.findIndex((c) => c.id === editing) + 1,
                  ).padStart(2, "0")}
                </span>
                <button onClick={() => setEditing(null)}>
                  {t.stopEdit}
                  <X size={13} />
                </button>
              </div>
            )}
            <div
              className={`artboard ${config.background === null ? "checker" : ""}`}
              data-testid="artboard"
            >
              <Icon
                config={config}
                interactive
                label={t.previewLabel}
                keyboardLabel={t.keyboard}
                onMove={(position) => patch({ position })}
              />
            </div>
            <div className="drag-hint">
              <Move size={13} />
              <span>{t.drag}</span>
            </div>
          </section>
          <aside className="action-panel" aria-label={t.actions}>
            <div className="current-actions">
              <div className="preview-actions">
                <div className="utility-actions">
                  <button
                    onClick={() => {
                      setConfig(randomConfig());
                      setEditing(null);
                    }}
                    className="outline-button"
                  >
                    <Shuffle size={16} />
                    {t.random}
                  </button>
                  <button
                    onClick={() => {
                      setConfig(structuredClone(DEFAULT));
                      setEditing(null);
                      setNotice("resetDone");
                    }}
                    className="icon-button"
                    aria-label={t.reset}
                    title={t.reset}
                  >
                    <RotateCcw size={17} />
                  </button>
                </div>
                <button className="primary-button add-button" onClick={add}>
                  <Plus size={17} />
                  {t.add}
                </button>
              </div>
              {editing && (
                <button className="update-button" onClick={update}>
                  <CheckCheck size={16} />
                  {t.update}
                </button>
              )}
              <div className="individual-downloads">
                <span>{t.downloadHint}</span>
                <div>
                  <button
                    aria-label={t.png}
                    title={t.png}
                    disabled={busy}
                    onClick={() =>
                      void runExport(() => downloadIcon(config, "png"))
                    }
                  >
                    <ArrowDown size={14} />
                    PNG
                  </button>
                  <span className="download-divider" />
                  <button
                    aria-label={t.svg}
                    title={t.svg}
                    disabled={busy}
                    onClick={() =>
                      void runExport(() => downloadIcon(config, "svg"))
                    }
                  >
                    <ArrowDown size={14} />
                    SVG
                  </button>
                </div>
              </div>
            </div>
            <section className="collection" aria-labelledby="collection-title">
              <div className="collection-heading">
                <h2 id="collection-title">
                  {t.collection}
                  <span className="count-badge">{items.length}</span>
                </h2>
                <button
                  className="clear-button"
                  disabled={!items.length || busy}
                  onClick={() => setConfirm(true)}
                >
                  <Trash2 size={13} />
                  {t.clear}
                </button>
              </div>
              {!items.length ? (
                <div className="empty-collection">
                  <span className="empty-icon">
                    <FolderHeart size={23} strokeWidth={1.3} />
                  </span>
                  <div>
                    <strong>{t.empty}</strong>
                  </div>
                </div>
              ) : (
                <div className="candidate-grid">
                  {items.map((item, i) => (
                    <div
                      key={item.id}
                      className={`candidate ${editing === item.id ? "is-editing" : ""}`}
                    >
                      <button
                        className={`candidate-preview ${item.config.background === null ? "checker" : ""}`}
                        onClick={() => load(item)}
                        aria-label={`${t.edit} ${i + 1}`}
                      >
                        <Icon config={item.config} />
                      </button>
                      <div className="candidate-meta">
                        <span>#{String(i + 1).padStart(2, "0")}</span>
                        <button
                          onClick={() => remove(item.id)}
                          aria-label={`${t.remove} ${i + 1}`}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="collection-export">
                <label className="format-select">
                  <span className="sr-only">{t.format}</span>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as ExportFormat)}
                    disabled={busy}
                  >
                    <option value="png">PNG</option>
                    <option value="svg">SVG</option>
                    <option value="both">PNG + SVG</option>
                  </select>
                  <ChevronRight size={13} />
                </label>
                <button
                  className="primary-button export-button"
                  aria-label={
                    progress !== null
                      ? `${t.exporting} ${progress}%`
                      : t.downloadAll
                  }
                  disabled={!items.length || busy}
                  onClick={exportAll}
                >
                  {busy ? (
                    <LoaderCircle className="spin" size={16} />
                  ) : (
                    <Download size={16} />
                  )}
                  <span>
                    {progress !== null ? `${progress}%` : t.downloadAll}
                  </span>
                  <span className="zip-label">.ZIP</span>
                </button>
              </div>
              {progress !== null && (
                <progress
                  className="export-progress"
                  max="100"
                  value={progress}
                  aria-label={t.exporting}
                />
              )}
              {(storageError || initial.error) && (
                <p className="storage-note error" role="alert">
                  {storageError ? t.storageError : t.restoreError}
                </p>
              )}
              <details className="storage-info">
                <summary>{t.local}</summary>
                <p>{t.localNote}</p>
              </details>
            </section>
            <footer className="workspace-footer">
              <p>{t.rights}</p>
            </footer>
          </aside>
        </main>
      </div>
      <div
        className={`toast ${notice ? "visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {notice && (
          <>
            <Check size={16} />
            {t[notice]}
          </>
        )}
      </div>
      <dialog
        ref={dialog}
        className="confirm-dialog"
        onCancel={() => setConfirm(false)}
      >
        <div>
          <span className="dialog-icon">
            <Trash2 size={22} />
          </span>
          <h2>{t.clearTitle}</h2>
          <p>{t.clearBody}</p>
          <div className="dialog-actions">
            <button
              className="outline-button"
              onClick={() => setConfirm(false)}
            >
              {t.cancel}
            </button>
            <button
              className="primary-button"
              onClick={() => {
                mutate([]);
                setEditing(null);
                setConfirm(false);
                setNotice("cleared");
              }}
            >
              {t.confirm}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
function ColorPicker({
  lang,
  value,
  onChange,
}: {
  lang: Lang;
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="palette-grid" aria-label={copy[lang].color}>
      {palette.map((color) => (
        <button
          key={color.hex}
          className={`color-option ${value === color.hex ? "selected" : ""}`}
          aria-label={color[lang]}
          title={`${color[lang]} ${color.hex}`}
          aria-pressed={value === color.hex}
          onClick={() => onChange(color.hex)}
        >
          <span className="color-circle" style={{ background: color.hex }}>
            {value === color.hex && (
              <Check size={19} color="white" strokeWidth={2} />
            )}
          </span>
          <span className="color-name">{color[lang]}</span>
        </button>
      ))}
    </div>
  );
}
