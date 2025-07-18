import gsap from "gsap";

const projectData = [
  {
    title: "Euphoria",
    img: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    isAlternate: false,
  },
  {
    title: "Scratcher",
    img: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=765&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    isAlternate: true,
  },
  {
    title: "Ember",
    img: "https://images.unsplash.com/photo-1612204186347-fef88cc864db?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    isAlternate: false,
  },
  {
    title: "Liquid",
    img: "https://images.unsplash.com/photo-1718049719671-3c0a592ac8c0?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    isAlternate: true,
  },
  
  // {
  //   title: "Vacuum",
  //   img: "https://images.unsplash.com/photo-1736612356978-df5dc8f678d0?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  //   isAlternate: false,
  // },
  // {
  //   title: "Synthesis",
  //   img: "https://images.unsplash.com/photo-1736580602062-885256588e01?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  //   isAlternate: true,
  // },
];


const lerp = (start, end, factor) => start + (end - start) * factor;

const config = {
  SCROLL_SPEED: 0.75,
  LERP_FACTOR: 0.05,
  BUFFER_SIZE: 20, // Increased buffer size to keep more cards in memory
  CLEANUP_THRESHOLD: 100, // Increased threshold to prevent premature cleanup
  MAX_VELOCITY: 120,
  MOBILE_BREAKPOINT: 768,
  CARD_SPACING: 30, // vw spacing between cards (reduced from 40)
  CARD_WIDTH: 25, // vw width of each card
  CARD_WIDTH_MOBILE: 65, // vw width for mobile
  CARD_SPACING_MOBILE: 80, // vw spacing for mobile (reduced from 80)
  DRAG_RESISTANCE: 1.3, // Lower value = more responsive dragging
  TRANSITION_SPEED: 0.3, // Transition speed for card scaling
  ACTIVE_CARD_SCALE: 1.2, // Scale factor for active card
  SCALE_TRANSITION_DURATION: 0.6, // Duration for scale transitions
  SCALE_TRANSITION_EASE: "power2.inOut", // Easing for scale transitions
  PROXIMITY_THRESHOLD: 1.5, // How close to center before scaling starts (increased from 0.5)
  MIN_SCALE: 1.0, // Minimum scale for cards
};

const state = {
  currentX: 0,
  targetX: 0,
  lastX: 0,
  scrollVelocity: 0,
  isDragging: false,
  startX: 0,
  projects: new Map(),
  parallaxImages: new Map(),
  projectWidth: window.innerWidth * (config.CARD_WIDTH / 100), // Convert vw to px
  lastScrollTime: Date.now(),
  isScrolling: false,
  isMobile: window.innerWidth < config.MOBILE_BREAKPOINT,
  dragStartX: 0,
  dragLastX: 0,
  visibleProjects: new Set(), // Track which projects are currently visible
  activeCardIndex: 0, // Track which card is currently in the middle
  previousActiveCardIndex: null, // Track previous active card for animations
  lastDirection: null, // Track scroll direction
};

const createParallaxImage = (imageElement) => {
  let bounds = null;
  let currentTranslateX = 0;
  let targetTranslateX = 0;

  const updateBounds = () => {
    if (imageElement) {
      const rect = imageElement.getBoundingClientRect();
      bounds = {
        left: rect.left + window.scrollX,
        right: rect.right + window.scrollX,
      };
    }
  };

  const update = (scroll) => {
    if (!bounds || state.isMobile) return;

    const relativeScroll = -scroll - bounds.left;
    targetTranslateX = relativeScroll * 0.05;
    currentTranslateX = lerp(currentTranslateX, targetTranslateX, 0.1);

    if (Math.abs(currentTranslateX - targetTranslateX) > 0.01) {
      imageElement.style.transform = `translateX(${currentTranslateX}px) scale(1.2)`;
    }
  };

  updateBounds();
  return { update, updateBounds };
};

const getProjectData = (index) => {
  const dataIndex =
    ((Math.abs(index) % projectData.length) + projectData.length) %
    projectData.length;
  return projectData[dataIndex];
};

const createProjectElement = (index) => {
  if (state.projects.has(index)) return;

  const template = document.querySelector(".template");
  const project = template.cloneNode(true);
  project.style.display = "flex";
  project.classList.remove("template");

  const data = getProjectData(index);
  const projectNumber = ((Math.abs(index) % projectData.length) + 1).toString().padStart(2, "0");

  // Card layout with image and title overlay
  project.innerHTML = `
    <div class="img"><img src="${data.img}" alt="${data.title}"></div>
    <div class="title">
      <h1 class="project-title">${data.title}</h1>
      <h1 class="project-number">${projectNumber}</h1>
    </div>
  `;

  // Set width explicitly based on config
  project.style.width = state.isMobile ? `${config.CARD_WIDTH_MOBILE}vw` : `${config.CARD_WIDTH}vw`;
  
  const spacing = state.isMobile ? config.CARD_SPACING_MOBILE : config.CARD_SPACING;
  project.style.transform = `translateX(${index * spacing}vw)`;
  project.style.position = "absolute";
  project.dataset.index = index; // Store index as data attribute for debugging
  
  // Initially hide the title and number
  const titleElement = project.querySelector('.title');
  gsap.set(titleElement, { autoAlpha: 0, y: 20 });
  
  document.querySelector(".project-list").appendChild(project);
  state.projects.set(index, project);
  state.visibleProjects.add(index);

  const img = project.querySelector("img");
  if (img) {
    state.parallaxImages.set(index, createParallaxImage(img));
  }
};

const createInitialProjects = () => {
  for (let i = -config.BUFFER_SIZE; i < config.BUFFER_SIZE; i++) {
    createProjectElement(i);
  }
};

const getCurrentIndex = () => Math.round(-state.targetX / (window.innerWidth * (state.isMobile ? config.CARD_SPACING_MOBILE : config.CARD_SPACING) / 100));

const isProjectVisible = (index, currentIndex) => {
  const spacing = state.isMobile ? config.CARD_SPACING_MOBILE : config.CARD_SPACING;
  const viewportWidth = window.innerWidth;
  const projectPosition = index * spacing * (viewportWidth / 100) + state.currentX;
  
  // Consider a project visible if it's within viewport bounds with some margin
  return projectPosition > -viewportWidth && projectPosition < viewportWidth * 1.5;
};

const checkAndCreateProjects = () => {
  const currentIndex = getCurrentIndex();
  const minNeeded = currentIndex - config.BUFFER_SIZE;
  const maxNeeded = currentIndex + config.BUFFER_SIZE;

  // Create projects that should be visible but don't exist yet
  for (let i = minNeeded; i <= maxNeeded; i++) {
    if (!state.projects.has(i)) {
      createProjectElement(i);
    }
  }

  // Update visibility status for all projects
  state.projects.forEach((project, index) => {
    const visible = isProjectVisible(index, currentIndex);
    
    // If project is far outside viewport and not needed in buffer, remove it
    if (!visible && (index < minNeeded || index > maxNeeded)) {
      project.remove();
      state.projects.delete(index);
      state.parallaxImages.delete(index);
      state.visibleProjects.delete(index);
    }
  });
};

const updateCardPositions = () => {
  const currentIndex = getCurrentIndex();
  const exactCurrentPosition = -state.currentX / (window.innerWidth * (state.isMobile ? config.CARD_SPACING_MOBILE : config.CARD_SPACING) / 100);
  
  // Determine scroll direction
  const currentDirection = state.targetX > state.lastX ? 'right' : 'left';
  if (currentDirection !== state.lastDirection) {
    state.lastDirection = currentDirection;
  }
  state.lastX = state.targetX;
  
  // Check if active card has changed
  if (state.activeCardIndex !== currentIndex) {
    state.previousActiveCardIndex = state.activeCardIndex;
    state.activeCardIndex = currentIndex;
    
    // Show title for the active card
    if (state.projects.has(currentIndex)) {
      const activeProject = state.projects.get(currentIndex);
      const titleElement = activeProject.querySelector('.title');
      
      gsap.to(titleElement, {
        autoAlpha: 1,
        y: 0,
        duration: 0.4,
        delay: 0.1,
        ease: "power2.out"
      });
    }
    
    // Hide title for the previous active card
    if (state.previousActiveCardIndex !== null && state.projects.has(state.previousActiveCardIndex)) {
      const prevActiveProject = state.projects.get(state.previousActiveCardIndex);
      const prevTitleElement = prevActiveProject.querySelector('.title');
      
      gsap.to(prevTitleElement, {
        autoAlpha: 0,
        y: 20,
        duration: 0.3,
        ease: "power2.out"
      });
    }
    
    // Hide titles for all non-active cards to ensure they're hidden in both directions
    state.projects.forEach((project, index) => {
      if (index !== currentIndex) {
        const titleElement = project.querySelector('.title');
        gsap.to(titleElement, {
          autoAlpha: 0,
          y: 20,
          duration: 0.3,
          ease: "power2.out"
        });
      }
    });
  }
  
  state.projects.forEach((project, index) => {
    // Calculate the base position
    const spacing = state.isMobile ? config.CARD_SPACING_MOBILE : config.CARD_SPACING;
    
    // Convert currentX from pixels to vw
    const currentXInVw = state.currentX / (window.innerWidth / 100);
    
    // Calculate proximity to center (0 = at center, 1 = one full card away)
    const distanceFromCenter = Math.abs(exactCurrentPosition - index);
    const normalizedDistance = Math.min(distanceFromCenter, config.PROXIMITY_THRESHOLD) / config.PROXIMITY_THRESHOLD;
    
    // Calculate scale based on proximity to center
    // When normalizedDistance is 0, scale is ACTIVE_CARD_SCALE
    // When normalizedDistance is 1 or greater, scale is MIN_SCALE
    let targetScale;
    if (normalizedDistance >= 1) {
      targetScale = config.MIN_SCALE;
    } else {
      targetScale = config.MIN_SCALE + (config.ACTIVE_CARD_SCALE - config.MIN_SCALE) * (1 - normalizedDistance);
    }
    
    // Apply position and smooth scale transition
    gsap.to(project, {
      x: `${index * spacing + currentXInVw + 10}vw`,
      scale: targetScale,
      duration: 0.3,
      ease: "power1.out",
      overwrite: "auto"
    });
  });
};

const animate = () => {
  const now = Date.now();
  const timeSinceLastScroll = now - state.lastScrollTime;

  if (!state.isDragging) {
    state.currentX = lerp(state.currentX, state.targetX, config.LERP_FACTOR);
  }

  checkAndCreateProjects();
  updateCardPositions();

  state.projects.forEach((project, index) => {
    const parallaxImage = state.parallaxImages.get(index);
    if (parallaxImage) {
      parallaxImage.update(state.currentX);
    }
  });

  requestAnimationFrame(animate);
};

const handleWheel = (e) => {
  e.preventDefault();
  state.lastScrollTime = Date.now();

  const scrollDelta = e.deltaX || e.deltaY;
  state.targetX -= Math.max(
    Math.min(scrollDelta * config.SCROLL_SPEED, config.MAX_VELOCITY),
    -config.MAX_VELOCITY
  );
};

const handleTouchStart = (e) => {
  if (e.touches.length === 1) {
    state.isDragging = true;
    state.startX = e.touches[0].clientX;
    state.lastX = state.currentX;
    state.lastScrollTime = Date.now();
    e.preventDefault();
  }
};

const handleTouchMove = (e) => {
  if (!state.isDragging || e.touches.length !== 1) return;
  const deltaX = (e.touches[0].clientX - state.startX) * config.DRAG_RESISTANCE * 2;
  state.currentX = state.lastX + deltaX;
  state.targetX = state.currentX;
  state.lastScrollTime = Date.now();
  state.isScrolling = true;
  e.preventDefault();
};

const handleTouchEnd = (e) => {
  state.isDragging = false;
  e.preventDefault();
};

const handleMouseDown = (e) => {
  state.isDragging = true;
  state.dragStartX = e.clientX;
  state.dragLastX = state.currentX;
  state.lastScrollTime = Date.now();
  document.body.style.cursor = 'grabbing';
  e.preventDefault();
};

const handleMouseMove = (e) => {
  if (!state.isDragging) return;
  const deltaX = (e.clientX - state.dragStartX) * config.DRAG_RESISTANCE;
  state.currentX = state.dragLastX + deltaX;
  state.targetX = state.currentX;
  state.lastScrollTime = Date.now();
  state.isScrolling = true;
  e.preventDefault();
};

const handleMouseUp = (e) => {
  if (state.isDragging) {
    state.isDragging = false;
    document.body.style.cursor = 'grab';
    e.preventDefault();
  }
};

const handleResize = () => {
  state.isMobile = window.innerWidth < config.MOBILE_BREAKPOINT;
  state.projectWidth = window.innerWidth * (state.isMobile ? config.CARD_WIDTH_MOBILE / 100 : config.CARD_WIDTH / 100);
  
  // Recreate all projects with new layout
  state.projects.forEach((project) => project.remove());
  state.projects.clear();
  state.parallaxImages.clear();
  state.visibleProjects.clear();
  state.previousActiveCardIndex = null;
  createInitialProjects();
  
  const spacing = state.isMobile ? config.CARD_SPACING_MOBILE : config.CARD_SPACING;
  state.projects.forEach((project, index) => {
    project.style.width = state.isMobile ? `${config.CARD_WIDTH_MOBILE}vw` : `${config.CARD_WIDTH}vw`;
    gsap.set(project, { x: `${index * spacing}vw`, scale: 1 });
    
    // Hide all titles initially
    const titleElement = project.querySelector('.title');
    gsap.set(titleElement, { autoAlpha: 0, y: 20 });
    
    const parallaxImage = state.parallaxImages.get(index);
    if (parallaxImage) {
      parallaxImage.updateBounds();
    }
  });
};

const initializeScroll = () => {
  const projectList = document.querySelector(".project-list");
  
  projectList.addEventListener("mousedown", handleMouseDown);
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);
  window.addEventListener("mouseleave", handleMouseUp);
  projectList.addEventListener("touchstart", handleTouchStart, { passive: false });
  projectList.addEventListener("touchmove", handleTouchMove, { passive: false });
  projectList.addEventListener("touchend", handleTouchEnd, { passive: false });
  
  window.addEventListener("wheel", handleWheel, { passive: false });
  window.addEventListener("resize", handleResize);

  createInitialProjects();
  animate();
};

document.addEventListener("DOMContentLoaded", initializeScroll);