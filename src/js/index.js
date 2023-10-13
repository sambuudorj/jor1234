require("@babel/polyfill");
import Search from "./model/Search";
import { elements, renderLoader, clearLoader } from "./view/base";
import * as searchView from "./view/searchView";
import Recipe from "./model/Recipe";
import List from "./model/List";
import Likes from "./model/Like";
import * as likesView from "./view/likesView";
import * as listView from "./view/listView";

import {
  renderRecipe,
  clearRecipe,
  highlightSelectedRecipe,
} from "./view/recipeView";

/*

вэб аппын төлөв
    - Хайлтын query, үр дүн
    - Тухайн үзүүлж байгаа жор
    - Лайкласан жорууд
    - Захиалж байгаа жорын найралгуу

*/

const state = {};

/*
- Хайлтын контроллор
*/

const controlSearch = async () => {
  // 1) Вэбээс хайлтын түлхүүр үгийг гаргаж авна.
  const query = searchView.getInput();

  if (query) {
    // 2) Шинээр хайлтын объектыг үүсгэж өгнө
    state.search = new Search(query);

    // 3) Хайлт хийхэд зориулж дэлгэцийн UI бэлтгэнэ
    searchView.clearSearchQuery();
    searchView.clearSearchResult();
    renderLoader(elements.searchResultsDiv);

    // 4) Хайлтыг гүйцэтгэнэ
    await state.search.doSearch();

    // 5) Хайлтын үр дүнг дэлгэцэнд үзүүлнэ
    clearLoader();
    if (state.search.result === undefined) alert("Хайлт илэрцгүй...");
    else searchView.renderRecipes(state.search.result);
  }
};

elements.searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  controlSearch();
});

elements.pageButtons.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-inline");

  if (btn) {
    const gotoPageNumber = parseInt(btn.dataset.goto, 10);
    searchView.clearSearchResult();
    searchView.renderRecipes(state.search.result, gotoPageNumber);
  }
});

const r = new Recipe(47746);
r.getRecipe();

/*
- Жорын контроллер
*/

const controlRecipe = async () => {
  // 1) URL-аас ID-ийг салгаж
  const id = window.location.hash.replace("#", "");

  // URL дээр ID байгаа эсэхийг шалгана
  if (id) {
    // 2) Жорын моделийг үүсгэж өгнө
    state.recipe = new Recipe(id);

    // 3) UI дэлгэцийг бэлтгэнэ
    clearRecipe();
    renderLoader(elements.recipeDiv);
    highlightSelectedRecipe(id);

    // 4) Жороо татаж авчирна
    await state.recipe.getRecipe();

    // 5) Жорыг гүйцэтгэх хугацаа болон орцыг тооцоолно
    clearLoader();
    state.recipe.calcTime();
    state.recipe.calcHuniiToo();

    // 6) Жороо цэлгэцэнд гаргана
    renderRecipe(state.recipe, state.likes.isLiked(id));
  }
};

// Нэг мөр код болгож болно

// window.addEventListener("hashchange", controlRecipe);
// window.addEventListener("load", controlRecipe);

["hashchange", "load"].forEach((e) =>
  window.addEventListener(e, controlRecipe)
);

window.addEventListener("load", (e) => {
  // Шинээр лайк моделийг апп дөнгөж ачаалагдахад үүсгэнэ
  if (!state.likes) state.likes = new Likes();

  // Лайк цэсийг гаргах эсэхийг шийдэх
  likesView.toggleLikeMenu(state.likes.getNumberOfLikes());

  // Лайкууд байвал тэдгээрийг цэсэнд нэмж харуулна
  state.likes.likes.forEach((like) => likesView.renderLike(like));
});

/*
- Найрлаганы контроллер
*/

const controlList = () => {
  // Найрлаганы моделийг үүсгэнэ
  state.list = new List();

  // Өмнө харагдаж байсан найрлагуудыг дэлгэцнээс цэвэрлэнэ
  listView.clearItems();

  // Уг модел руу одоо харагдаж байгаа жорын бүх найрлагыг авч хийнэ
  state.recipe.ingredients.forEach((n) => {
    // Тухайн найрлагыг модел руу хийнэ.
    const item = state.list.addItem(n);

    // Тухайн найрлагыг дэлгэцэнд гаргана
    listView.renderItem(item);
  });
};

/*
-Like контроллор
*/

const controlLike = () => {
  // 1) Лайкийн моделийг үүсгэнэ
  if (!state.likes) state.likes = new Likes();

  // 2) Одоо харагдаж байгаа жорын ID-ийг олж авах
  const currentRecipeId = state.recipe.id;

  // 3) Энэ жорыг лайкласан эсэхийг шалгах
  if (state.likes.isLiked(currentRecipeId)) {
    // Лайкласан бол лайкыг нь болиулна
    state.likes.deleteLike(currentRecipeId);

    // Лайкын цэснээс устгана
    likesView.deleteLike(currentRecipeId);

    // Лайк товчны лайкалсан байдлыг болиулах
    likesView.toogleLikeBtn(false);
  } else {
    // Лайклаагүй бол лайклана
    const newLike = state.likes.addLike(
      currentRecipeId,
      state.recipe.title,
      state.recipe.publisher,
      state.recipe.image_url
    );

    // Лайк цэсэнд энэ лайкыг
    likesView.renderLike(newLike);

    // Лайк товчны лайкалсан байдлыг лайкласан болгох
    likesView.toogleLikeBtn(true);
  }

  likesView.toggleLikeMenu(state.likes.getNumberOfLikes());
};

elements.recipeDiv.addEventListener("click", (e) => {
  if (e.target.matches(".recipe__btn, .recipe__btn *")) {
    controlList();
  } else if (e.target.matches(".recipe__love, .recipe__love *")) {
    controlLike();
  }
});

elements.shoppingList.addEventListener("click", (e) => {
  // Клик хийсэн li элементийн data-itemid аттрибутыг шүүж гаргаж авах
  const id = e.target.closest(".shopping__item").dataset.itemid;

  // Олдсон ID-тэй орцыг моделоос устгана
  state.list.deleteItem(id);

  // Дэлгэцээс ийм ID-тэй орцыг олж бас устгана
  listView.deleteItem(id);
});
