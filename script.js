// Ingredient row utilities
function addIngredientRow(containerId, name = '', qty = '', unit = '') {
  const unitOptions = [
    "g", "kg", "tsp", "tbsp", "cup", "oz", "lb", "ml", "l", "pinch", "pcs", "slice", "clove", "can", "quart"
  ];
  const container = containerId
    ? document.getElementById(containerId)
    : document.getElementById('ingredients-list');
  const div = document.createElement('div');
  div.className = 'ingredient-row';
  div.style.display = 'flex';
  div.style.gap = '8px';
  div.style.marginBottom = '6px';
  div.innerHTML = `
    <input class="ingredient-name" type="text" style="flex:2" placeholder="Ingredient" value="${name.replace(/"/g, "&quot;")}"/>
    <input class="ingredient-qty" type="text" style="flex:1" placeholder="Amount" value="${qty.replace(/"/g, "&quot;")}"/>
    <select class="ingredient-unit" style="flex:1">
      ${unitOptions.map(u => `<option value="${u}"${u === unit ? ' selected' : ''}>${u}</option>`).join('')}
    </select>
  `;
  container.appendChild(div);
}
const recipeList = document.getElementById('recipeList');
const suggestions = document.getElementById('suggestions');
const searchInput = document.getElementById('search');

const seedRecipes = [
  {
    title: "Fluffy Pancakes",
    image: "https://www.allrecipes.com/thmb/L7yYPDCicVZ5OPb8xZ8q8b7GlX0=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/21014-GoodOldFashionedPancakes-mfs-74-1x1-1-b82378b82e4e44f7b1e4c9241b5cfddc.jpg",
    tags: ["breakfast", "quick"],
    ingredients: "Flour 0 g\nEggs 0 pcs\nMilk 0 ml\nBaking powder 0 tsp\nSugar 0 g",
    steps: "Mix ingredients\nPour on griddle\nFlip and serve",
    note: ""
  },
  {
    title: "Spaghetti Bolognese",
    image: "",
    tags: ["dinner", "italian"],
    ingredients: "Spaghetti 0 g\nGround beef 0 g\nTomato sauce 0 ml\nGarlic 0 clove\nOnion 0 pcs",
    steps: "Boil pasta\nCook beef\nMix with sauce\nCombine and serve",
    note: ""
  }
];

function getRecipes() {
  const data = JSON.parse(localStorage.getItem('recipes') || '[]');
  return data.length === 0 ? seedRecipes : data;
}

function saveRecipes(data) {
  localStorage.setItem('recipes', JSON.stringify(data));
}

// Drag-and-drop state
let draggedIndex = null;

function handleDragStart(e) {
  draggedIndex = +e.currentTarget.dataset.index;
}

function handleDragOver(e) {
  e.preventDefault();
}

function handleDrop(e) {
  const droppedIndex = +e.currentTarget.dataset.index;
  if (draggedIndex === null || draggedIndex === droppedIndex) return;
  const recipes = getRecipes();
  const [moved] = recipes.splice(draggedIndex, 1);
  recipes.splice(droppedIndex, 0, moved);
  saveRecipes(recipes);
  renderRecipes();
}

function renderRecipes(filter = '') {
  const recipes = getRecipes();
  recipeList.innerHTML = '';
  const filtered = recipes.filter(r =>
    r.title.toLowerCase().includes(filter) ||
    r.tags.join(',').toLowerCase().includes(filter) ||
    r.ingredients.toLowerCase().includes(filter)
  );
  filtered.forEach((r, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.draggable = true;
    card.dataset.index = i;
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('drop', handleDrop);
    card.innerHTML = `
      ${r.image ? `<img src="${r.image}" alt="${r.title}">` : ''}
      <h3>${r.title}</h3>
      <p><strong>Tags:</strong> ${r.tags.join(', ')}</p>
      <p><strong>Ingredients:</strong><br>${r.ingredients.replace(/\n/g, "<br>")}</p>
      <p><strong>Steps:</strong><br>${r.steps.replace(/\n/g, "<br>")}</p>
      <textarea placeholder="Notes..." oninput="saveNote(${i}, this.value)">${r.note}</textarea>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
        <button onclick="editRecipe(${i})">Edit</button>
        <button onclick="deleteRecipe(${i})" class="danger">Delete</button>
      </div>
    `;
    recipeList.appendChild(card);
  });
}

function addRecipe() {
  const title = document.getElementById('title').value.trim();
  const image = document.getElementById('image').dataset.url ? document.getElementById('image').dataset.url : "";
  const tags = document.getElementById('tags').value.trim().split(',').map(x => x.trim()).filter(Boolean);
  // Parse dynamic ingredients
  const ingredientsArr = [];
  document.querySelectorAll('#ingredients-list .ingredient-row').forEach(row => {
    const name = row.querySelector('.ingredient-name').value.trim();
    const qty = row.querySelector('.ingredient-qty').value.trim();
    const unit = row.querySelector('.ingredient-unit').value;
    if (name) ingredientsArr.push(`${name} ${qty || '0'} ${unit}`);
  });
  const ingredients = ingredientsArr.join('\n');
  const steps = document.getElementById('steps').value.trim();

  if (!title) return alert("Title required.");

  const recipes = getRecipes();
  recipes.push({ title, image, tags, ingredients, steps, note: "" });
  saveRecipes(recipes);
  renderRecipes();
  document.getElementById('title').value = '';
  document.getElementById('image').value = '';
  document.getElementById('image').dataset.url = '';
  document.getElementById('image-preview').style.display = 'none';
  document.getElementById('tags').value = '';
  // Reset ingredients rows
  document.getElementById('ingredients-list').innerHTML = '';
  addIngredientRow();
  document.getElementById('steps').value = '';
}

function deleteRecipe(index) {
  if (!confirm("Delete this recipe?")) return;
  const recipes = getRecipes();
  recipes.splice(index, 1);
  saveRecipes(recipes);
  renderRecipes();
}

function moveRecipeUp(index) {
  const recipes = getRecipes();
  if (index > 0) {
    [recipes[index - 1], recipes[index]] = [recipes[index], recipes[index - 1]];
    saveRecipes(recipes);
    renderRecipes();
  }
}

function moveRecipeDown(index) {
  const recipes = getRecipes();
  if (index < recipes.length - 1) {
    [recipes[index], recipes[index + 1]] = [recipes[index + 1], recipes[index]];
    saveRecipes(recipes);
    renderRecipes();
  }
}

function editRecipe(index) {
  const unitOptions = [
    "g", "kg", "tsp", "tbsp", "cup", "oz", "lb", "ml", "l", "pinch", "pcs", "slice", "clove", "can", "quart"
  ];
  const recipes = getRecipes();
  const r = recipes[index];
  const card = recipeList.children[index];
  // Parse ingredients as [{name, qty, unit}]
  let ingredientRows = "";
  const ingredientLines = r.ingredients.split('\n').filter(Boolean);
  ingredientLines.forEach((line, idx) => {
    // Split from end: last word unit, second last qty, rest name
    const parts = line.trim().split(/\s+/);
    let name = "", qty = "", unit = "";
    if (parts.length >= 3) {
      unit = parts.pop();
      qty = parts.pop();
      name = parts.join(' ');
    } else if (parts.length === 2) {
      qty = parts.pop();
      name = parts.join(' ');
      unit = "";
    } else if (parts.length === 1) {
      name = parts[0];
      qty = "";
      unit = "";
    }
    ingredientRows += `
      <div class="ingredient-row" style="display:flex;gap:8px;margin-bottom:6px">
        <input class="ingredient-name" type="text" value="${name.replace(/"/g, "&quot;")}" style="flex:2" placeholder="Ingredient"/>
        <input class="ingredient-qty" type="text" value="${qty.replace(/"/g, "&quot;")}" style="flex:1" placeholder="Amount"/>
        <select class="ingredient-unit" style="flex:1">
          ${unitOptions.map(u => `<option value="${u}"${u===unit?' selected':''}>${u}</option>`).join('')}
        </select>
      </div>
    `;
  });
  if (!ingredientRows) {
    ingredientRows = `
      <div class="ingredient-row" style="display:flex;gap:8px;margin-bottom:6px">
        <input class="ingredient-name" type="text" style="flex:2" placeholder="Ingredient"/>
        <input class="ingredient-qty" type="text" style="flex:1" placeholder="Amount"/>
        <select class="ingredient-unit" style="flex:1">
          ${unitOptions.map(u => `<option value="${u}">${u}</option>`).join('')}
        </select>
      </div>
    `;
  }
  card.innerHTML = `
    <input value="${r.title.replace(/"/g, "&quot;")}" id="edit-title-${index}" />
    <div>
      <input type="file" id="edit-image-${index}" accept="image/*" />
      <img id="edit-image-preview-${index}" style="display:${r.image?'block':'none'};max-width:140px;margin-top:6px;border-radius:6px;" ${r.image?`src="${r.image}"`:''}/>
    </div>
    <input value="${r.tags.join(', ').replace(/"/g, "&quot;")}" id="edit-tags-${index}" />
    <div id="edit-ingredients-list-${index}">
      ${ingredientRows}
    </div>
    <button type="button" onclick="addIngredientRow('edit-ingredients-list-${index}')">Add Ingredient</button>
    <textarea id="edit-steps-${index}">${r.steps}</textarea>
    <textarea placeholder="Notes..." oninput="saveNote(${index}, this.value)">${r.note}</textarea>
    <button onclick="saveEditedRecipe(${index})">Save</button>
    <button class="danger" onclick="deleteRecipe(${index})">Delete</button>
  `;
  // Setup image upload for edit
  const imgInput = card.querySelector(`#edit-image-${index}`);
  const imgPreview = card.querySelector(`#edit-image-preview-${index}`);
  imgInput.onchange = function(e) {
    if (this.files && this.files[0]) {
      const reader = new FileReader();
      reader.onload = function(ev) {
        imgPreview.src = ev.target.result;
        imgPreview.style.display = 'block';
        imgInput.dataset.url = ev.target.result;
      };
      reader.readAsDataURL(this.files[0]);
    }
  };
}

function saveEditedRecipe(index) {
  const title = document.getElementById(`edit-title-${index}`).value.trim();
  // Prefer new uploaded image if present
  const imgInput = document.getElementById(`edit-image-${index}`);
  const image = imgInput && imgInput.dataset.url ? imgInput.dataset.url : (imgInput && imgInput.value ? imgInput.value : "");
  const tags = document.getElementById(`edit-tags-${index}`).value.trim().split(',').map(x => x.trim()).filter(Boolean);
  // Parse dynamic ingredient rows
  const ingredientsArr = [];
  const ingList = document.getElementById(`edit-ingredients-list-${index}`);
  ingList.querySelectorAll('.ingredient-row').forEach(row => {
    const name = row.querySelector('.ingredient-name').value.trim();
    const qty = row.querySelector('.ingredient-qty').value.trim();
    const unit = row.querySelector('.ingredient-unit').value;
    if (name) ingredientsArr.push(`${name} ${qty || '0'} ${unit}`);
  });
  const ingredients = ingredientsArr.join('\n');
  const steps = document.getElementById(`edit-steps-${index}`).value.trim();

  if (!title) return alert("Title is required.");

  const recipes = getRecipes();
  recipes[index] = { ...recipes[index], title, image, tags, ingredients, steps };
  saveRecipes(recipes);
  renderRecipes();
}

function saveNote(index, val) {
  const recipes = getRecipes();
  recipes[index].note = val;
  saveRecipes(recipes);
}

function handleSearch(value) {
  const val = value.toLowerCase();
  renderRecipes(val);
  const all = getRecipes();
  const matches = new Set();
  all.forEach(r => {
    r.tags.forEach(tag => tag.toLowerCase().includes(val) && matches.add(tag));
    r.title.toLowerCase().includes(val) && matches.add(r.title);
    r.ingredients.toLowerCase().includes(val) && matches.add(...r.ingredients.split('\n').filter(x => x.toLowerCase().includes(val)));
  });
  suggestions.innerHTML = '';
  [...matches].forEach(m => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.textContent = m;
    item.onclick = () => {
      searchInput.value = m;
      renderRecipes(m.toLowerCase());
      suggestions.innerHTML = '';
    };
    suggestions.appendChild(item);
  });
}

renderRecipes();

// Setup initial dynamic ingredients UI and image upload preview
document.addEventListener('DOMContentLoaded', function() {
  // Remove legacy textarea if present
  const ingList = document.getElementById('ingredients-list');
  if (ingList && ingList.children.length === 0) {
    addIngredientRow();
  }
  // Image upload for add
  const imgInput = document.getElementById('image');
  const imgPreview = document.getElementById('image-preview');
  imgInput.onchange = function(e) {
    if (this.files && this.files[0]) {
      const reader = new FileReader();
      reader.onload = function(ev) {
        imgPreview.src = ev.target.result;
        imgPreview.style.display = 'block';
        imgInput.dataset.url = ev.target.result;
      };
      reader.readAsDataURL(this.files[0]);
    }
  };
});