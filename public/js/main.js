// public/js/main.js
// Design Pattern: Module Pattern (IIFE)
// Client-side JavaScript for SmartHome Tracker

const AppModule = (function () {
  'use strict';

  // ── Private State ──────────────────────────────────────────────────────────
  let _weatherData = null;
  let _earthquakeData = null;

  // ── Private Functions ──────────────────────────────────────────────────────

  // Fetch weather from our server API (which calls OpenWeatherMap)
  const _fetchWeather = async (city) => {
    try {
      const res  = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      const json = await res.json();
      if (json.success) {
        _weatherData = json.data;
        _renderWeatherWidget(json.data);
      } else {
        _renderWeatherError(json.message);
      }
    } catch (err) {
      _renderWeatherError('Could not load weather data.');
    }
  };

  const _renderWeatherWidget = (data) => {
    const widget = document.getElementById('weatherWidget');
    if (!widget) return;
    const icon = `https://openweathermap.org/img/w/${data.weather[0].icon}.png`;
    widget.innerHTML = `
      <div class="d-flex align-items-center gap-3">
        <img src="${icon}" alt="${data.weather[0].description}" width="50">
        <div>
          <h6 class="mb-0 fw-bold">${data.name}, ${data.sys.country}</h6>
          <span class="fs-4 fw-bold">${data.main.temp.toFixed(1)}°C</span><br>
          <small class="text-muted text-capitalize">${data.weather[0].description}</small><br>
          <small>Humidity: ${data.main.humidity}% | Wind: ${data.wind.speed} m/s</small>
        </div>
      </div>`;
  };

  const _renderWeatherError = (msg) => {
    const widget = document.getElementById('weatherWidget');
    if (widget) widget.innerHTML = `<p class="text-muted small"><i class="bi bi-cloud-slash"></i> ${msg}</p>`;
  };

  // Fetch earthquake data from JMA (Japan Meteorological Agency) via our API
  const _fetchEarthquake = async () => {
    try {
      const res = await fetch('/api/earthquake');
      const json = await res.json();
      if (json.success) {
        _earthquakeData = json.data;
        _renderEarthquakeWidget(json.data);
      } else {
        _renderEarthquakeError(json.message);
      }
    } catch (err) {
      _renderEarthquakeError('地震情報を取得できませんでした');
    }
  };

  const _renderEarthquakeWidget = (quakes) => {
    const widget = document.getElementById('earthquakeWidget');
    if (!widget) return;

    if (!quakes || quakes.length === 0) {
      widget.innerHTML = '<p class="text-muted small">最近の地震情報はありません</p>';
      return;
    }

    const html = quakes.slice(0, 5).map(eq => {
      const time = eq.time ? new Date(eq.time).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '不明';
      const intensity = eq.maxIntensity || '-';
      const magnitude = eq.magnitude || '-';
      const epicenter = eq.epicenter || '不明';

      // Color based on intensity
      let badgeClass = 'bg-secondary';
      if (intensity >= 5) badgeClass = 'bg-danger';
      else if (intensity >= 3) badgeClass = 'bg-warning text-dark';
      else if (intensity >= 1) badgeClass = 'bg-info';

      return `
        <div class="earthquake-item border-bottom py-2">
          <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
              <div class="fw-semibold small">${epicenter}</div>
              <small class="text-muted">${time}</small>
            </div>
            <div class="text-end">
              <span class="badge ${badgeClass}">震度 ${intensity}</span>
              <div class="small text-muted">M${magnitude}</div>
            </div>
          </div>
          ${eq.tsunami ? '<small class="text-danger"><i class="bi bi-exclamation-triangle-fill"></i> 津波注意</small>' : ''}
        </div>`;
    }).join('');

    widget.innerHTML = html;
  };

  const _renderEarthquakeError = (msg) => {
    const widget = document.getElementById('earthquakeWidget');
    if (widget) widget.innerHTML = `<p class="text-muted small"><i class="bi bi-exclamation-circle"></i> ${msg}</p>`;
  };

  // Highlight expiry card borders
  const _initExpiryHighlights = () => {
    document.querySelectorAll('.item-card[data-expiry-status="expired"]')
      .forEach(el => el.classList.add('border-danger', 'border-2'));
    document.querySelectorAll('.item-card[data-expiry-status="soon"]')
      .forEach(el => el.classList.add('border-warning', 'border-2'));
  };

  // Confirm before delete
  const _initDeleteConfirm = () => {
    document.querySelectorAll('.delete-form').forEach(form => {
      form.addEventListener('submit', (e) => {
        if (!confirm('Are you sure you want to delete this item?')) {
          e.preventDefault();
        }
      });
    });
  };

  // Live city weather search
  const _initWeatherSearch = () => {
    const btn   = document.getElementById('weatherSearchBtn');
    const input = document.getElementById('cityInput');
    if (btn && input) {
      btn.addEventListener('click', () => {
        const city = input.value.trim() || 'Calgary';
        _fetchWeather(city);
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); _fetchWeather(input.value.trim() || 'Calgary'); }
      });
    }
  };

  // Auto-dismiss alerts after 4 seconds
  const _initAutoDismissAlerts = () => {
    document.querySelectorAll('.alert-dismissible').forEach(alert => {
      setTimeout(() => {
        const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
        bsAlert.close();
      }, 4000);
    });
  };

  // ── Public API ─────────────────────────────────────────────────────────────
  const init = () => {
    _initExpiryHighlights();
    _initDeleteConfirm();
    _initWeatherSearch();
    _initAutoDismissAlerts();

    // Auto-load weather on dashboard
    const widget = document.getElementById('weatherWidget');
    if (widget) _fetchWeather('Calgary');

    // Auto-load earthquake data on dashboard
    const earthquakeWidget = document.getElementById('earthquakeWidget');
    if (earthquakeWidget) _fetchEarthquake();
  };

  return {
    init,
    fetchWeather: _fetchWeather, // expose for external calls
    fetchEarthquake: _fetchEarthquake,
    getWeatherData: () => _weatherData,
    getEarthquakeData: () => _earthquakeData
  };
})();

document.addEventListener('DOMContentLoaded', AppModule.init);
