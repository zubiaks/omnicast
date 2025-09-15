window.OCFavs = (() => {
  const KEY = 'oc:favs';

  function loadFavs() {
    try {
      return new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));
    } catch {
      return new Set();
    }
  }

  function saveFavs(favs) {
    try {
      localStorage.setItem(KEY, JSON.stringify([...favs]));
    } catch (err) {
      console.error('Erro ao guardar favoritos:', err);
    }
  }

  function toggleFav(id) {
    const favs = loadFavs();
    if (favs.has(id)) {
      favs.delete(id);
    } else {
      favs.add(id);
    }
    saveFavs(favs);
    return favs;
  }

  function isFav(id) {
    return loadFavs().has(id);
  }

  function countFavsByType(masterList, favSet) {
    const counts = { iptv: 0, webcam: 0, vod: 0, radio: 0 };
    masterList.forEach(item => {
      if (favSet.has(item.id) && counts.hasOwnProperty(item.type)) {
        counts[item.type]++;
      }
    });
    return counts;
  }

  return { loadFavs, saveFavs, toggleFav, isFav, countFavsByType };
})();
