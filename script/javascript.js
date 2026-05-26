function initMarquees() {
  const marquees = document.querySelectorAll(".marquee");

  marquees.forEach((marquee) => {
    const track = marquee.querySelector(".marquee__track");
    if (!track) return;

    const originalList = track.querySelector(".marquee__list");
    if (!originalList) return;

    const originalWidth = originalList.offsetWidth;

    const cloneList = originalList.cloneNode(true);
    cloneList.setAttribute("aria-hidden", "true");
    track.appendChild(cloneList);

    const totalWidth = originalWidth * 2;

    const speed = marquee.dataset.speed || 50;
    const duration = totalWidth / speed;

    track.style.animation = `marquee-scroll ${duration}s linear infinite`;
    track.style.willChange = "transform";

    if (marquee.classList.contains("marquee--reverse")) {
      track.style.animation = `marquee-scroll-reverse ${duration}s linear infinite`;
    }
  });
}

function addMarqueeKeyframes() {
  if (document.querySelector("#marquee-keyframes")) return;

  const style = document.createElement("style");
  style.id = "marquee-keyframes";
  style.textContent = `
    @keyframes marquee-scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes marquee-scroll-reverse {
      0% { transform: translateX(-50%); }
      100% { transform: translateX(0); }
    }
  `;
  document.head.appendChild(style);
}

function reinitMarquees() {
  const marquees = document.querySelectorAll(".marquee");
  marquees.forEach((marquee) => {
    const track = marquee.querySelector(".marquee__track");
    if (track && track.style.animation) {
      const lists = track.querySelectorAll(".marquee__list");
      for (let i = 1; i < lists.length; i++) {
        lists[i].remove();
      }
      track.style.animation = "none";
    }
  });
  setTimeout(initMarquees, 100);
}

addMarqueeKeyframes();
initMarquees();

let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(reinitMarquees, 200);
});

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    e.preventDefault();
    document
      .querySelector(anchor.getAttribute("href"))
      .scrollIntoView({ behavior: "smooth" });
  });
});

// Инициализация адаптивного слайдера
(function () {
  // === НАСТРОЙКИ АДАПТИВА ===
  const breakpoints = {
    // (от 992px и выше)
    992: {
      slidesToShow: 3, // показывать 3 карточки
      slidesToScroll: 3, // пролистывать по 3 карточки
    },
    // (от 481px до 991px)
    767: {
      slidesToShow: 2, // показывать 2 карточки
      slidesToScroll: 2, // пролистывать по 2 карточки
    },
    // (от 481px до 991px)
    660: {
      slidesToShow: 2, // показывать 2 карточки
      slidesToScroll: 2, // пролистывать по 2 карточки
    },
    // (от 481px до 991px)
    481: {
      slidesToShow: 1, // показывать 2 карточки
      slidesToScroll: 1, // пролистывать по 2 карточки
    },
    // (480px и ниже)
    0: {
      slidesToShow: 1, // показывать 1 карточку
      slidesToScroll: 1, // пролистывать по 1 карточке
    },
  };

  const AUTO_SCROLL_INTERVAL = 4000; // Автопрокрутка каждые 4 секунды
  const INFINITE = true; // Зацикленная/бесконечная прокрутка

  // === ПОЛУЧАЕМ ЭЛЕМЕНТЫ ===
  const list = document.querySelector(".participants__list");
  const prevBtn = document.querySelector(".carousel-players__prev");
  const nextBtn = document.querySelector(".carousel-players__next");
  const numbersSpan = document.querySelector(".carousel-players__numbers");

  if (!list || !prevBtn || !nextBtn || !numbersSpan) {
    console.error("Не найдены элементы слайдера");
    return;
  }

  // Получаем оригинальные слайды
  const originalSlides = Array.from(list.children);
  const totalSlides = originalSlides.length;

  // Создаем обертку
  let sliderWrapper = list.parentElement;
  if (!sliderWrapper.classList.contains("carousel-slider-wrapper")) {
    sliderWrapper = document.createElement("div");
    sliderWrapper.className = "carousel-slider-wrapper";
    list.parentNode.insertBefore(sliderWrapper, list);
    sliderWrapper.appendChild(list);
  }

  // Текущие настройки
  let currentSettings = { slidesToShow: 3, slidesToScroll: 3 };
  let allSlidesExtended = [];
  let currentIndex = 0;
  let startIndex = 0;
  let autoScrollInterval = null;

  // Функция получения настроек по ширине экрана
  function getSettingsByWidth() {
    const width = window.innerWidth;
    let settings = breakpoints[0];

    for (const [breakpoint, bpSettings] of Object.entries(breakpoints)) {
      if (width >= parseInt(breakpoint)) {
        settings = bpSettings;
      }
    }

    return settings;
  }

  // Функция обновления счетчика (показываем последний видимый слайд)
  function updateCounter() {
    let lastVisibleNumber;

    if (INFINITE && allSlidesExtended.length > 0) {
      // Находим последний видимый оригинальный слайд
      let lastVisibleOriginalIndex = null;

      for (
        let i = currentIndex + currentSettings.slidesToShow - 1;
        i >= currentIndex;
        i--
      ) {
        if (i >= startIndex && i < startIndex + totalSlides) {
          lastVisibleOriginalIndex = i - startIndex;
          break;
        }
      }

      if (lastVisibleOriginalIndex !== null) {
        lastVisibleNumber = lastVisibleOriginalIndex + 1;
      } else {
        // Если не нашли (переходный момент), берем по индексу
        lastVisibleNumber = currentSettings.slidesToShow;
      }
    } else {
      // Для обычной прокрутки
      lastVisibleNumber = Math.min(
        currentIndex + currentSettings.slidesToShow,
        totalSlides
      );
    }

    // Показываем: "3/6" или "6/6"
    numbersSpan.innerHTML = `${lastVisibleNumber}<span class="carousel-players__numbers--half">/${totalSlides}</span>`;
  }

  // Функция перемещения к слайду
  function goToSlide(index, animate = true) {
    if (!animate) {
      list.style.transition = "none";
    }

    const firstSlide = allSlidesExtended[0];
    if (!firstSlide) return;

    const slideWidth = firstSlide.offsetWidth;
    const gap = parseFloat(getComputedStyle(list).gap) || 0;
    const translateX = -index * (slideWidth + gap);

    list.style.transform = `translateX(${translateX}px)`;

    if (!animate) {
      void list.offsetHeight;
      list.style.transition = "transform 0.5s ease-in-out";
    }

    currentIndex = index;
    updateCounter();

    // Бесконечная прокрутка (зацикливание)
    if (INFINITE && allSlidesExtended.length > totalSlides) {
      setTimeout(() => {
        if (currentIndex >= startIndex + totalSlides) {
          // Телепорт в начало (зацикливание)
          list.style.transition = "none";
          const newIndex =
            startIndex + (currentIndex - (startIndex + totalSlides));
          const newTranslateX = -newIndex * (slideWidth + gap);
          list.style.transform = `translateX(${newTranslateX}px)`;
          void list.offsetHeight;
          list.style.transition = "transform 0.5s ease-in-out";
          currentIndex = newIndex;
          updateCounter();
        } else if (currentIndex < startIndex) {
          // Телепорт в конец (зацикливание)
          list.style.transition = "none";
          const newIndex =
            startIndex + totalSlides - (startIndex - currentIndex);
          const newTranslateX = -newIndex * (slideWidth + gap);
          list.style.transform = `translateX(${newTranslateX}px)`;
          void list.offsetHeight;
          list.style.transition = "transform 0.5s ease-in-out";
          currentIndex = newIndex;
          updateCounter();
        }
      }, 500);
    }
  }

  // Следующий слайд
  function nextSlide() {
    let newIndex = currentIndex + currentSettings.slidesToScroll;

    if (!INFINITE) {
      const maxIndex = totalSlides - currentSettings.slidesToShow;
      if (newIndex > maxIndex) newIndex = maxIndex;
    }

    goToSlide(newIndex);
  }

  // Предыдущий слайд
  function prevSlide() {
    let newIndex = currentIndex - currentSettings.slidesToScroll;
    if (!INFINITE && newIndex < 0) newIndex = 0;
    goToSlide(newIndex);
  }

  // Автопрокрутка
  function startAutoScroll() {
    if (AUTO_SCROLL_INTERVAL > 0) {
      stopAutoScroll();
      autoScrollInterval = setInterval(() => {
        nextSlide();
      }, AUTO_SCROLL_INTERVAL);
    }
  }

  function stopAutoScroll() {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
  }

  // Перестроение слайдера при изменении размера экрана
  function rebuildSlider() {
    const newSettings = getSettingsByWidth();

    // Если настройки не изменились - не перестраиваем
    if (
      newSettings.slidesToShow === currentSettings.slidesToShow &&
      newSettings.slidesToScroll === currentSettings.slidesToScroll &&
      allSlidesExtended.length > 0
    ) {
      return;
    }

    currentSettings = newSettings;

    // Останавливаем автопрокрутку
    stopAutoScroll();

    // Очищаем список
    list.innerHTML = "";

    // Создаем расширенный список для бесконечной прокрутки (зацикливания)
    if (INFINITE) {
      const extendedSlides = [];

      // Добавляем копии в конец
      for (let i = 0; i < currentSettings.slidesToScroll; i++) {
        for (let j = 0; j < totalSlides; j++) {
          extendedSlides.push(originalSlides[j].cloneNode(true));
        }
      }

      // Добавляем оригинальные
      originalSlides.forEach((slide) => extendedSlides.push(slide));

      // Добавляем копии в начало
      for (let i = 0; i < currentSettings.slidesToScroll; i++) {
        for (let j = 0; j < totalSlides; j++) {
          extendedSlides.push(originalSlides[j].cloneNode(true));
        }
      }

      extendedSlides.forEach((slide) => list.appendChild(slide));
      allSlidesExtended = Array.from(list.children);
      startIndex = totalSlides * currentSettings.slidesToScroll;
      currentIndex = startIndex;
    } else {
      // Обычная прокрутка без клонов
      originalSlides.forEach((slide) =>
        list.appendChild(slide.cloneNode(true))
      );
      allSlidesExtended = Array.from(list.children);
      startIndex = 0;
      currentIndex = 0;
    }

    // Применяем стили к слайдам
    allSlidesExtended.forEach((slide) => {
      slide.style.flex = `0 0 calc(${100 / currentSettings.slidesToShow}% - ${(20 * (currentSettings.slidesToShow - 1)) / currentSettings.slidesToShow
        }px)`;
      slide.style.minWidth = "0";
    });

    // Устанавливаем позицию
    setTimeout(() => {
      goToSlide(currentIndex, false);
      startAutoScroll();
    }, 50);
  }

  // Обработчики событий
  prevBtn.addEventListener("click", () => {
    prevSlide();
    // Сбрасываем автопрокрутку при клике
    if (AUTO_SCROLL_INTERVAL > 0) {
      stopAutoScroll();
      startAutoScroll();
    }
  });

  nextBtn.addEventListener("click", () => {
    nextSlide();
    // Сбрасываем автопрокрутку при клике
    if (AUTO_SCROLL_INTERVAL > 0) {
      stopAutoScroll();
      startAutoScroll();
    }
  });

  // Останавливаем автопрокрутку при наведении на слайдер
  sliderWrapper.addEventListener("mouseenter", stopAutoScroll);
  sliderWrapper.addEventListener("mouseleave", startAutoScroll);

  // Следим за изменением размера окна
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      rebuildSlider();
    }, 200);
  });

  // Инициализация стилей
  list.style.display = "flex";
  list.style.transition = "transform 0.5s ease-in-out";
  list.style.gap = "20px";
  list.style.margin = "0";
  list.style.padding = "0";

  // Запуск
  rebuildSlider();
})();

/*********** STEPS **********/
function initResponsiveCarousel() {
  const wrapper = document.querySelector(".carousel-steps__wrapper");
  const list = document.querySelector(".steps__list");
  const prevBtn = document.querySelector(".carousel-steps__prev");
  const nextBtn = document.querySelector(".carousel-steps__next");
  const dotsContainer = document.querySelector(".carousel-steps__dots");

  if (!wrapper || !list) return;

  // СОХРАНЯЕМ оригинальный HTML ОДИН РАЗ
  if (!window.originalStepsHTML) {
    window.originalStepsHTML = list.innerHTML;
  }

  // ВСЕГДА восстанавливаем оригинал перед пересборкой
  list.innerHTML = window.originalStepsHTML;

  // Сброс стилей
  list.style.transform = "";
  list.style.transition = "";
  list.style.display = "";

  // Мобилка
  if (window.innerWidth <= 768) {
    const originalItems = [...list.querySelectorAll(".steps__item")];

    list.innerHTML = "";

    const slidesData = [];

    if (originalItems[0] && originalItems[1]) {
      slidesData.push([originalItems[0], originalItems[1]]);
    }

    if (originalItems[2]) {
      slidesData.push([originalItems[2]]);
    }

    if (originalItems[3] && originalItems[4]) {
      slidesData.push([originalItems[3], originalItems[4]]);
    }

    if (originalItems[5]) {
      slidesData.push([originalItems[5]]);
    }

    if (originalItems[6]) {
      slidesData.push([originalItems[6]]);
    }

    slidesData.forEach((items, index) => {
      const slide = document.createElement("li");

      slide.className = "carousel-slide";
      slide.dataset.slideIndex = index;

      items.forEach((item) => {
        slide.appendChild(item.cloneNode(true));
      });

      list.appendChild(slide);
    });

    const slides = [...list.querySelectorAll(".carousel-slide")];

    let currentSlide = 0;
    let isTransitioning = false;

    // DOTS
    if (dotsContainer) {
      dotsContainer.innerHTML = "";

      slides.forEach((_, index) => {
        const dot = document.createElement("span");

        dot.className = "carousel-steps__dot";

        if (index === 0) {
          dot.classList.add("carousel-steps__dot--active");
        }

        dot.addEventListener("click", () => {
          if (!isTransitioning) {
            currentSlide = index;
            moveSlider();
          }
        });

        dotsContainer.appendChild(dot);
      });
    }

    const dots = [...document.querySelectorAll(".carousel-steps__dot")];

    function moveSlider() {
      isTransitioning = true;

      const width = wrapper.clientWidth + 20;

      list.style.transform = `translateX(-${currentSlide * width}px)`;

      dots.forEach((dot, i) => {
        dot.classList.toggle(
          "carousel-steps__dot--active",
          i === currentSlide
        );
      });

      setTimeout(() => {
        isTransitioning = false;
      }, 500);
    }

    // УДАЛЯЕМ старые обработчики
    const newPrevBtn = prevBtn.cloneNode(true);
    const newNextBtn = nextBtn.cloneNode(true);

    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

    newPrevBtn.addEventListener("click", () => {
      if (currentSlide > 0 && !isTransitioning) {
        currentSlide--;
        moveSlider();
      }
    });

    newNextBtn.addEventListener("click", () => {
      if (currentSlide < slides.length - 1 && !isTransitioning) {
        currentSlide++;
        moveSlider();
      }
    });

    list.style.display = "flex";
    list.style.transition = "transform 0.5s ease";

    moveSlider();
  }
}

// INIT
document.addEventListener("DOMContentLoaded", initResponsiveCarousel);

// RESIZE
let resizeTimer;

window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);

  resizeTimer = setTimeout(() => {
    initResponsiveCarousel();
  }, 200);
});
