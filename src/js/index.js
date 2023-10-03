require("@babel/polyfill");
import Search from "./model/Search";
import { elements, renderLoader, clearLoader } from "./view/base";
import * as searchView from "./view/searchView";

/*

вэб аппын төлөв
    - Хайлтын query, үр дүн
    - Тухайн үзүүлж байгаа жор
    - Лайкласан жорууд
    - Захиалж байгаа жорын найралгуу

*/

const state = {};

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
