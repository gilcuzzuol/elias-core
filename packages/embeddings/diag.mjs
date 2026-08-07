// Diagnóstico do download/carregamento do modelo de embeddings.
// Mostra o progresso em tempo real. Rodar:  node packages/embeddings/diag.mjs
import { pipeline } from "@huggingface/transformers";

const MODEL = process.env.ELIAS_EMBEDDINGS_MODEL ?? "Xenova/multilingual-e5-large";
const DTYPE = process.env.ELIAS_EMBEDDINGS_DTYPE ?? "q8";

console.log(`Modelo: ${MODEL}  |  dtype: ${DTYPE}`);
console.log("Carregando (baixa na primeira vez)...\n");

const seen = {};
const t0 = Date.now();

const extractor = await pipeline("feature-extraction", MODEL, {
  dtype: DTYPE,
  progress_callback: (p) => {
    if (p.status === "progress" && p.file) {
      const pct = p.progress ? p.progress.toFixed(1) : "?";
      // imprime só quando muda ~5% pra não poluir
      const bucket = Math.floor((p.progress ?? 0) / 5);
      if (seen[p.file] !== bucket) {
        seen[p.file] = bucket;
        const mb = p.total ? (p.total / 1e6).toFixed(0) : "?";
        console.log(`  ${p.file}  ${pct}%  (${mb} MB)`);
      }
    } else if (p.status === "done" && p.file) {
      console.log(`  ✓ ${p.file}`);
    }
  },
});

console.log(`\nModelo pronto em ${((Date.now() - t0) / 1000).toFixed(1)}s. Gerando 1 embedding...`);
const out = await extractor(["query: teste de embedding do ELIAS"], {
  pooling: "mean",
  normalize: true,
});
const vec = out.tolist()[0];
console.log(`OK — dimensão: ${vec.length}  (esperado 1024)`);
