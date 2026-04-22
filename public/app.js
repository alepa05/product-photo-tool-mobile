const form = document.getElementById("uploadForm");
const inputFile = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const resultImg = document.getElementById("resultImg");
const emailInput = document.getElementById("email");

let immaginiGenerate = [];

inputFile.addEventListener("change", () => {
  const file = inputFile.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    preview.src = e.target.result;
    preview.style.display = "block";
  };
  reader.readAsDataURL(file);
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = inputFile.files[0];
  const codice = document.getElementById("codice").value;

  if (!file || !codice) {
    alert("Compila tutti i campi");
    return;
  }

  const formData = new FormData();
  formData.append("image", file);
  formData.append("codice", codice);

  try {
    const res = await fetch("/upload", {
      method: "POST",
      body: formData
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    resultImg.src = url;
    resultImg.style.display = "block";

    immaginiGenerate.push(blob);

  } catch (err) {
    console.error(err);
    alert("Errore di connessione");
  }
});

document.getElementById("nuovaImg").addEventListener("click", () => {
  document.getElementById("codice").value = "";
  inputFile.value = "";
  preview.style.display = "none";
});

document.getElementById("inviaEmail").addEventListener("click", async () => {
  const email = emailInput.value;

  if (!email || immaginiGenerate.length === 0) {
    alert("Nessuna immagine o email mancante");
    return;
  }

  const formData = new FormData();
  formData.append("email", email);

  immaginiGenerate.forEach((img, i) => {
    formData.append("images", img, `img_${i}.jpg`);
  });

  try {
    await fetch("/send-multiple", {
      method: "POST",
      body: formData
    });

    alert("Email inviata!");
    immaginiGenerate = [];

  } catch (err) {
    alert("Errore invio email");
  }
});
