
import React, { useMemo, useState } from "react";
import { contentEngineService } from "../services/contentEngineService";
import { CaptionVariant, MarketingAngle, ProductBrief, VideoBlueprint, MediaAsset } from "../types";
import { addManyAssets } from "../services/libraryService";

type EngineStep = "input" | "brief" | "angles" | "create" | "export";

interface EngineProps {
  onLibraryChanged?: () => void;
}

const Engine: React.FC<EngineProps> = ({ onLibraryChanged }) => {
  const [step, setStep] = useState<EngineStep>("input");
  const [sourceText, setSourceText] = useState("");
  const [status, setStatus] = useState<"idle" | "running" | "error" | "ready">("idle");
  const [error, setError] = useState<string | null>(null);

  const [brief, setBrief] = useState<ProductBrief | null>(null);
  const [angles, setAngles] = useState<MarketingAngle[]>([]);
  const [selectedAngleId, setSelectedAngleId] = useState<string>("");

  const selectedAngle = useMemo(
    () => angles.find(a => a.id === selectedAngleId) || null,
    [angles, selectedAngleId]
  );

  const [images, setImages] = useState<{ id: string; label: string; prompt: string; url?: string; loading?: boolean }[]>([
    { id: "img1", label: "Product Hero", prompt: "Close up bottle shot, premium lighting" },
    { id: "img2", label: "Hands Context", prompt: "Professional application, glamorous nails" },
    { id: "img3", label: "Graphic Text-led", prompt: "Clean flatlay with text space" },
  ]);

  const [blueprints, setBlueprints] = useState<VideoBlueprint[]>([]);
  const [captions, setCaptions] = useState<CaptionVariant[]>([]);

  // Video State
  const [videoPrompt, setVideoPrompt] = useState<string>(
    "Create a vertical 9:16 social video showing a nail tech applying builder gel neatly, with clean premium lighting, satisfying close-ups, and a confident finished reveal. Add subtle salon ambience."
  );
  const [rawVideo, setRawVideo] = useState<{ dataUrl: string; mimeType: string } | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>("");
  const [selectedCaptionId, setSelectedCaptionId] = useState<string>("");

  const runBriefAndAngles = async () => {
    setStatus("running");
    setError(null);
    try {
      const b = await contentEngineService.extractBrief(sourceText.trim());
      setBrief(b);

      const a = await contentEngineService.generateAngles(b);
      setAngles(a);
      setSelectedAngleId(a?.[0]?.id || "");

      setStatus("ready");
      setStep("angles");
    } catch (e: any) {
      setStatus("error");
      setError(e?.message || "Engine failed");
    }
  };

  const generateOneImage = async (id: string) => {
    if (!brief || !selectedAngle) return;
    setImages(prev => prev.map(i => i.id === id ? { ...i, loading: true } : i));
    try {
      const img = images.find(i => i.id === id);
      const prompt = `${selectedAngle.name}. ${img?.prompt || ""}. Brief: ${brief.whatItIs}.`;
      const url = await contentEngineService.generateImage(prompt);
      setImages(prev => prev.map(i => i.id === id ? { ...i, url, loading: false } : i));
    } catch (e: any) {
      setImages(prev => prev.map(i => i.id === id ? { ...i, loading: false } : i));
      alert(e?.message || "Image gen failed");
    }
  };

  const generateRawVideo = async () => {
    if (!brief || !selectedAngle) return;

    setVideoLoading(true);
    try {
      // Make the prompt “brand + angle” aware
      const fullPrompt =
        `${videoPrompt}\n\n` +
        `Brand: Crystal Clawz.\n` +
        `Angle: ${selectedAngle.name}.\n` +
        `Product: ${brief.whatItIs}.\n` +
        `Audience: ${brief.whoItsFor}.`;

      const result = await contentEngineService.generateVideoFromPrompt({
        prompt: fullPrompt,
        aspectRatio: "9:16",
        durationSeconds: "8",
        resolution: "720p",
        model: "veo-3.1-fast-generate-preview",
      });

      setRawVideo(result);
    } catch (e: any) {
      alert(e?.message || "Video generation failed. CapCut pack still works.");
    } finally {
      setVideoLoading(false);
    }
  };

  const generateBlueprintsAndCaptions = async () => {
    if (!brief || !selectedAngle) return;
    setStatus("running");
    setError(null);
    try {
      const bps = await contentEngineService.generateBlueprints(brief, selectedAngle);
      const caps = await contentEngineService.generateCaptions(brief, selectedAngle);
      setBlueprints(bps);
      setCaptions(caps);
      setStatus("ready");
      setStep("create");
    } catch (e: any) {
      setStatus("error");
      setError(e?.message || "Failed generating");
    }
  };

  const exportPackText = useMemo(() => {
    if (!brief || !selectedAngle) return "";
    const chosenImages = images.filter(i => selectedImageIds.includes(i.id) && i.url).map(i => ({ label: i.label, dataUrl: i.url }));
    const chosenRawVideo = selectedImageIds.includes("rawVideo") && rawVideo
        ? { mimeType: rawVideo.mimeType, dataUrl: rawVideo.dataUrl }
        : null;
    const chosenBlueprint = blueprints.find(b => b.id === selectedBlueprintId) || null;
    const chosenCaption = captions.find(c => c.id === selectedCaptionId) || null;

    return JSON.stringify({
      brand: "Crystal Clawz",
      brief,
      angle: selectedAngle,
      selected: {
        images: chosenImages,
        rawVideo: chosenRawVideo,
        blueprint: chosenBlueprint,
        caption: chosenCaption
      },
      capcut_handoff_notes: "Paste blueprint scenes into CapCut as a scene plan. Use Gemini assets as overlays/B-roll where relevant.",
      createdAt: new Date().toISOString()
    }, null, 2);
  }, [brief, selectedAngle, images, selectedImageIds, blueprints, selectedBlueprintId, captions, selectedCaptionId, rawVideo]);

  const handleSaveToLibrary = () => {
    if (!brief || !selectedAngle) return;

    const createdAt = new Date().toISOString();
    const assetsToAdd: MediaAsset[] = [];

    // 1. Images
    images
      .filter(i => selectedImageIds.includes(i.id) && i.url)
      .forEach(i => {
        assetsToAdd.push({
          id: `img_${i.id}_${Date.now()}`,
          filename: `Engine_${selectedAngle.name}_${i.label}.png`,
          fileType: 'image',
          folderPath: 'Engine Packs',
          stage: 'Raw',
          url: i.url!,
          createdAt,
          tags: ['engine-generated', selectedAngle.name, 'image'],
          permissions: { status: 'not_needed' },
          status: 'draft'
        });
      });

    // 2. Video
    if (selectedImageIds.includes("rawVideo") && rawVideo) {
      assetsToAdd.push({
        id: `vid_${Date.now()}`,
        filename: `Engine_${selectedAngle.name}_RawVideo.mp4`,
        fileType: 'video',
        folderPath: 'Engine Packs',
        stage: 'Raw',
        url: rawVideo.dataUrl,
        orientation: '9:16',
        createdAt,
        tags: ['engine-generated', 'veo', selectedAngle.name, 'video'],
        permissions: { status: 'not_needed' },
        status: 'draft'
      });
    }

    // 3. Blueprint (Optional if selected)
    const chosenBlueprint = blueprints.find(b => b.id === selectedBlueprintId);
    if (chosenBlueprint) {
        assetsToAdd.push({
            id: `bp_${Date.now()}`,
            filename: `Blueprint_${selectedAngle.name}.json`,
            fileType: 'blueprint',
            folderPath: 'Engine Packs',
            stage: 'Final',
            url: '', // No visual url
            packData: JSON.stringify(chosenBlueprint),
            createdAt,
            tags: ['engine-generated', 'blueprint', selectedAngle.name],
            permissions: { status: 'not_needed' },
            status: 'draft'
        });
    }

    // 4. Caption (Optional if selected)
    const chosenCaption = captions.find(c => c.id === selectedCaptionId);
    if (chosenCaption) {
        assetsToAdd.push({
            id: `cap_${Date.now()}`,
            filename: `Caption_${selectedAngle.name}.json`,
            fileType: 'caption',
            folderPath: 'Engine Packs',
            stage: 'Final',
            url: '', 
            packData: JSON.stringify(chosenCaption),
            createdAt,
            tags: ['engine-generated', 'caption', selectedAngle.name],
            permissions: { status: 'not_needed' },
            status: 'draft'
        });
    }

    // 5. The Master Pack
    assetsToAdd.push({
      id: `pack_${Date.now()}`,
      filename: `Pack_${selectedAngle.name}_${new Date().toISOString().split('T')[0]}.json`,
      fileType: 'pack',
      folderPath: 'Engine Packs',
      stage: 'Final',
      url: '', 
      packData: exportPackText,
      createdAt,
      tags: ['content-pack', selectedAngle.name],
      permissions: { status: 'not_needed' },
      status: 'draft'
    });

    addManyAssets(assetsToAdd);
    onLibraryChanged?.();
    alert(`Pack saved to 'Engine Packs' folder in Library! (${assetsToAdd.length} assets added)`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Content Engine</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Product brief → angles → Gemini images → CapCut blueprint → captions → export pack.
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            status === "running" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
            status === "error" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
            status === "ready" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
            "bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-slate-300"
          }`}>
            {status.toUpperCase()}
          </div>
        </div>
        {error && <div className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</div>}
      </div>

      {/* Steps */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap gap-2 mb-6">
          {(["input","angles","create","export"] as EngineStep[]).map(s => (
            <button
              key={s}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
                step === s ? "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300" : "bg-white dark:bg-gray-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-600"
              }`}
              onClick={() => setStep(s)}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>

        {step === "input" && (
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Paste product info (for now)</label>
            <textarea
              className="w-full min-h-[180px] p-4 border border-slate-200 dark:border-gray-600 rounded-xl bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Paste product description, benefits, how-to, objections, etc..."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
            />
            <button
              className="px-5 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-semibold disabled:bg-slate-300 dark:disabled:bg-gray-600"
              disabled={!sourceText.trim() || status === "running"}
              onClick={runBriefAndAngles}
            >
              Build Brief + Angles
            </button>
          </div>
        )}

        {step === "angles" && (
          <div className="space-y-6">
            {!brief ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">Run “Build Brief + Angles” first.</div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50">
                    <div className="text-xs font-bold text-pink-600 dark:text-pink-400 mb-2 uppercase">What it is</div>
                    <div className="text-sm text-slate-700 dark:text-slate-300">{brief.whatItIs}</div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50">
                    <div className="text-xs font-bold text-pink-600 dark:text-pink-400 mb-2 uppercase">Who it’s for</div>
                    <div className="text-sm text-slate-700 dark:text-slate-300">{brief.whoItsFor}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Choose a marketing angle</div>
                  <div className="grid md:grid-cols-3 gap-3">
                    {angles.map(a => (
                      <button
                        key={a.id}
                        onClick={() => setSelectedAngleId(a.id)}
                        className={`p-4 rounded-xl border text-left ${
                          selectedAngleId === a.id ? "border-pink-300 bg-pink-50 dark:border-pink-800 dark:bg-pink-900/30" : "border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        <div className="font-bold text-slate-900 dark:text-white">{a.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{a.objective}</div>
                        <div className="text-sm text-slate-700 dark:text-slate-300 mt-3">{a.hook}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="px-5 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-semibold disabled:bg-slate-300 dark:disabled:bg-gray-600"
                  disabled={!selectedAngleId || status === "running"}
                  onClick={generateBlueprintsAndCaptions}
                >
                  Generate Blueprints + Captions
                </button>
              </>
            )}
          </div>
        )}

        {step === "create" && (
          <div className="space-y-8">
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Generate images (Gemini)</div>
              <div className="grid md:grid-cols-3 gap-4">
                {images.map(img => (
                  <div key={img.id} className="border border-slate-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    <div className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">{img.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{img.prompt}</div>
                      <button
                        className="mt-4 w-full px-4 py-2 rounded-lg bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-sm font-semibold disabled:bg-slate-300 dark:disabled:bg-gray-600"
                        onClick={() => generateOneImage(img.id)}
                        disabled={img.loading || !brief || !selectedAngle}
                      >
                        {img.loading ? "Generating..." : "Generate"}
                      </button>
                      {img.url && (
                        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={selectedImageIds.includes(img.id)}
                            onChange={(e) => {
                              setSelectedImageIds(prev =>
                                e.target.checked ? [...prev, img.id] : prev.filter(x => x !== img.id)
                              );
                            }}
                          />
                          Select
                        </label>
                      )}
                    </div>
                    {img.url && (
                      <div className="bg-slate-50 dark:bg-gray-700 border-t border-slate-200 dark:border-gray-600">
                        <img src={img.url} className="w-full h-52 object-cover" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Raw Video Block */}
            <div className="border border-slate-200 dark:border-gray-700 rounded-2xl p-5">
              <div className="text-sm font-semibold text-slate-800 dark:text-white mb-2">
                Optional: Generate raw video (Gemini Veo)
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                If Veo is blocked for your key/account, ignore this — the CapCut blueprint pack below still runs your workflow.
              </div>

              <textarea
                className="w-full min-h-[110px] p-3 border border-slate-200 dark:border-gray-600 rounded-xl bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:outline-none"
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
              />

              <button
                className="mt-3 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-sm font-semibold disabled:bg-slate-300 dark:disabled:bg-gray-600"
                onClick={generateRawVideo}
                disabled={videoLoading || !brief || !selectedAngle}
              >
                {videoLoading ? "Generating..." : "Generate Raw Video"}
              </button>

              {rawVideo && (
                <div className="mt-4">
                  <video
                    src={rawVideo.dataUrl}
                    controls
                    className="w-full rounded-xl border border-slate-200 dark:border-gray-700"
                  />
                  <label className="mt-3 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={selectedImageIds.includes("rawVideo")}
                      onChange={(e) => {
                        setSelectedImageIds(prev =>
                          e.target.checked
                            ? [...prev, "rawVideo"]
                            : prev.filter(x => x !== "rawVideo")
                        );
                      }}
                    />
                    Select raw video for export pack
                  </label>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-semibold text-slate-800 dark:text-white mb-3">CapCut Blueprints</div>
                <div className="space-y-3">
                  {blueprints.map(bp => (
                    <label key={bp.id} className="block p-4 rounded-xl border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700">
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="blueprint"
                          checked={selectedBlueprintId === bp.id}
                          onChange={() => setSelectedBlueprintId(bp.id)}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{bp.title}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{bp.duration}</div>
                          <div className="text-sm text-slate-700 dark:text-slate-300 mt-2">{bp.shotInstructions}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Captions</div>
                <div className="space-y-3">
                  {captions.map(c => (
                    <label key={c.id} className="block p-4 rounded-xl border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700">
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="caption"
                          checked={selectedCaptionId === c.id}
                          onChange={() => setSelectedCaptionId(c.id)}
                          className="mt-1"
                        />
                        <div>
                          <div className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase">{c.type}</div>
                          <div className="text-sm text-slate-800 dark:text-slate-200 mt-2 whitespace-pre-wrap">{c.content}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              className="px-5 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-semibold disabled:bg-slate-300 dark:disabled:bg-gray-600"
              disabled={selectedImageIds.length === 0 || !selectedBlueprintId || !selectedCaptionId}
              onClick={() => setStep("export")}
            >
              Build Export Pack
            </button>
          </div>
        )}

        {step === "export" && (
          <div className="space-y-4">
            <div className="text-sm text-slate-600 dark:text-slate-300">
              This pack is your “handoff” to CapCut + your scheduler workflows.
            </div>

            {/* CapCut Ready Notes */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50">
              <div className="text-sm font-bold text-slate-900 dark:text-white">CapCut Handoff (copy this)</div>
              <div className="mt-2 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono">
{`TITLE: ${selectedAngle?.name || "Campaign"} - ${brief?.whatItIs?.slice(0, 60) || ""}

VIDEO FORMAT: 9:16
DURATION: 8–15s
STYLE: Premium, clean, salon aesthetic

HOOK:
${selectedAngle?.hook || ""}

CAPTION (selected):
${captions.find(c => c.id === selectedCaptionId)?.content || ""}

BLUEPRINT (selected):
${(blueprints.find(b => b.id === selectedBlueprintId)?.scenes || [])
  .map(s => `${s.time} — ${s.action} / TEXT: ${s.overlay}`)
  .join("\n")}

CTA:
${blueprints.find(b => b.id === selectedBlueprintId)?.cta || ""}

ASSETS:
- Use the selected Gemini images as overlays / B-roll
- If raw video exists, import and cut to blueprint timing`}
              </div>
            </div>

            <textarea
              className="w-full min-h-[260px] p-4 border border-slate-200 dark:border-gray-600 rounded-xl bg-slate-50 dark:bg-gray-700 font-mono text-xs text-slate-900 dark:text-white"
              value={exportPackText}
              readOnly
            />
            
            <div className="flex flex-wrap gap-2">
                <button
                  className="px-5 py-3 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-semibold"
                  onClick={() => navigator.clipboard.writeText(exportPackText)}
                  disabled={!exportPackText}
                >
                  Copy JSON to Clipboard
                </button>

                <button
                  className="px-5 py-3 rounded-xl bg-slate-800 dark:bg-gray-200 dark:text-slate-800 text-white font-semibold"
                  onClick={() => {
                    const blob = new Blob([exportPackText], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `content-pack-${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  disabled={!exportPackText}
                >
                  Download Pack (JSON)
                </button>

                <button
                  className="px-5 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-semibold"
                  onClick={handleSaveToLibrary}
                  disabled={!exportPackText}
                >
                  Save Pack to Library
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Engine;
