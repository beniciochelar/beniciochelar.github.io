const textInput = document.getElementById("textInput")
const highlightedText = document.getElementById("highlightedText")
const continueBtn = document.getElementById("continueBtn")
const formContainer = document.getElementById("formContainer")
const generateBtn = document.getElementById("generateBtn")
const resultSection = document.getElementById("resultSection")
const resultText = document.getElementById("resultText")

let matches = []
const highlight = () => {
  highlightedText.classList.toggle("hidden", false)

  const text = textInput.value
  matches = [...text.matchAll(/\{\s*[^{}]+?\s*\}/g)]
  
  if (matches.length > 0) {
    let highlighted = text.replace(/(\{\s*[^{}]+?\s*\})/g, "<mark>$1</mark>")
    highlightedText.innerHTML = highlighted
    continueBtn.disabled = false
    highlightedText.style.color = "inherit"
  } else {
    highlightedText.textContent = "No se detectó texto entre llaves '{}'."
    continueBtn.disabled = true
    highlightedText.style.color = "red"
  }
}

textInput.addEventListener("input", highlight)


continueBtn.addEventListener("click", () => {
  formContainer.innerHTML = ""
  matches.forEach((match, index) => {
    const label = document.createElement("label")
    label.textContent = `Campo ${index + 1} (${match[0]}):`
    const input = document.createElement("input")
    input.type = "text"
    input.placeholder = match[0]
    input.dataset.placeholder = match[0]
    formContainer.appendChild(label)
    formContainer.appendChild(input)
  })
  formContainer.classList.remove("hidden")
  generateBtn.classList.remove("hidden")
})

generateBtn.addEventListener("click", () => {
  const inputs = formContainer.querySelectorAll("input")
  let hasEmpty = false
  inputs.forEach(input => {
    if (!input.value.trim()) hasEmpty = true
  })

  if (hasEmpty) {
    const confirmContinue = confirm("Hay campos vacíos. ¿Deseas continuar de todos modos?")
    if (!confirmContinue) return
  }

  let finalText = textInput.value
  inputs.forEach(input => {
    const original = input.dataset.placeholder
    const value = input.value.trim()
    if (value) {
      finalText = finalText.replace(original, value)
    }
  })

  resultText.textContent = finalText
  resultSection.classList.remove("hidden")
  resultText.scrollIntoView({ behavior: "smooth" })
})

function copyToClipboard() {
  navigator.clipboard.writeText(resultText.textContent)
    .then(() => {
      const boton = document.getElementById('copyBtn')
      const image = document.getElementById("copyImage")

      boton.textContent = "Copiado con exito!"
      boton.style.backgroundColor = "lime"
      image.style.display = "none"
    })
    .catch(() => alert("No se pudo copiar el texto."))
}
