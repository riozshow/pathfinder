const initApp = () => {
  aboutTab.onclick = () => {
    tabContents.map((content) => content.classList.remove("active"));
    tabContents
      .find((content) => content.classList.contains("about-content"))
      .classList.add("active");
  };

  finderTab.onclick = () => {
    tabContents.map((content) => content.classList.remove("active"));
    tabContents
      .find((content) => content.classList.contains("finder-content"))
      .classList.add("active");
  };

  tabContents[0].classList.add("active");

  const matrix = new Matrix(10, 10);
  matrixWrapper.append(matrix.body);

  doneButton.onclick = () => {
    matrix.done();
  };
};

initApp();
