const myHeaders = new Headers();
myHeaders.append("x-access-token", "openuv-2qrbaqrlti1q4su-io");
myHeaders.append("Content-Type", "application/json");

const requestOptions = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow",
};

const SEARCHINGGLOBALCLIMATE = {
  keyAccess: "b027424d1698c5a620b7279e2d007a48",

  fetchingClimateData: function (locationPlace) {
    fetch(
      "https://api.openweathermap.org/data/2.5/weather?q=" +
        locationPlace +
        "&units=metric&limit=5&lang=es&&appid=" +
        this.keyAccess
    )
      .then((Promise) => Promise.json())
      .then((resultsData) => this.useFetchedData(resultsData));

    fetch(
      "http://api.openweathermap.org/geo/1.0/direct?q=" +
        locationPlace +
        "&limit=1&appid=" +
        this.keyAccess
    )
      .then((Promise) => Promise.json())
      .then((resultsCoordinates) =>
        this.usingCoordinatesLocation(resultsCoordinates)
      );
  },

  useFetchedData: function (resultsData) {
    const { name } = resultsData;
    const { temp, humidity } = resultsData.main;
    const { description, icon } = resultsData.weather[0];
    const { speed } = resultsData.wind;
    const { lon, lat } = resultsData.coord;

    function UVFecthData() {
      return fetch(
        "https://api.openuv.io/api/v1/uv?lat=" +
          lat +
          "&lng=" +
          lon +
          "&alt=100&dt=",
        requestOptions
      )
        .then((Promise) => Promise.json())
        .then((dataUV) => {
          const { uv } = dataUV.result;

          return uv;
        })
        .catch((error) => {
          console.log("error", error);
          return "Índice UV actualmente no disponible.";
        });
    }

    function forecastData() {
      return fetch(
        "https://api.openweathermap.org/data/2.5/forecast?lat=" +
          lat +
          "&lon=" +
          lon +
          "&units=metric&lang=es&" +
          "&appid=" +
          SEARCHINGGLOBALCLIMATE.keyAccess
      )
        .then((Promise) => Promise.json())
        .then((forecastResult) => {
          const storageForecastResults = [];

          forecastResult.list.forEach((item) => {
            const timeNowUTC = new Date(item.dt_txt);
            const timeNowLocal = new Date(
              timeNowUTC.getTime() - timeNowUTC.getTimezoneOffset() * 60000
            );

            const dayNames = [
              "Domingo",
              "Lunes",
              "Martes",
              "Miércoles",
              "Jueves",
              "Viernes",
              "Sábado",
            ];

            const monthNames = [
              "Enero",
              "Febrero",
              "Marzo",
              "Abril",
              "Mayo",
              "Junio",
              "Julio",
              "Agosto",
              "Septiembre",
              "Octubre",
              "Noviembre",
              "Diciembre",
            ];

            const timeNowLocalDay = dayNames[timeNowLocal.getDay()];
            const timeNowLocalDayNumber = timeNowLocal.getDate();
            const timeNowLocalMonth = monthNames[timeNowLocal.getMonth()];

            const tempMax = item.main.temp_max;
            const iconForecast = item.weather[0].icon;

            storageForecastResults.push([
              timeNowLocalDay,
              timeNowLocalDayNumber,
              timeNowLocalMonth,
              tempMax,
              iconForecast,
            ]);
          });

          return storageForecastResults;
        });
    }

    function stylingDescriptionFetched(description) {
      return description.charAt(0).toUpperCase() + description.slice(1);
    }

    document.querySelector(".title-city").innerText = name;
    document.querySelector(".iconState").src =
      "./assets/iconsForConditions/" + icon + ".png";
    document.querySelector(".climeData-temperature").innerText = temp + "  °C";
    document.querySelector(".climeData-description").innerText =
      stylingDescriptionFetched(description);

    document.querySelector(".humidity-Value").innerText = humidity + " %";
    document.querySelector(".wind-Value").innerText = speed + " m/s";

    UVFecthData().then((uv) => {
      document.querySelector(".UV-Value").innerText = uv.toFixed(2);
    });

    forecastData().then((storageForecastResults) => {
      const daysOfForecast = storageForecastResults.map(
        (returnDateVariable) => [
          returnDateVariable[0],
          returnDateVariable[1],
          returnDateVariable[2],
        ]
      );

      const finalDaysObject = {};

      daysOfForecast.forEach((duplicateDates) => {
        const [dayName, dayMonth, month] = duplicateDates;

        if (!finalDaysObject[dayMonth]) {
          finalDaysObject[dayMonth] = [dayName, dayMonth, month];
        }
      });
      const finalDays = Object.values(finalDaysObject);
      for (let i = 1; i <= finalDays.length; i++) {
        const eachDay = finalDays[i - 1];

        const eachDayText = `${eachDay[1]}/${eachDay[2]} ${eachDay[0]}`;

        const eachDayDocument = document.querySelector(`.p-${i}`);

        if (eachDayDocument) {
          eachDayDocument.innerText = eachDayText;
        }
      }
    });

    forecastData().then((storageForecastResults) => {
      const tempIconOriginal = storageForecastResults.map((item) => [
        item[0],
        item[3],
        item[4],
      ]);

      const objectTempIcons = {};

      tempIconOriginal.forEach((perDay) => {
        const [dayID, tempID, iconID] = perDay;

        if (!objectTempIcons[dayID]) {
          objectTempIcons[dayID] = {
            temperatures: [],
            icons: [],
          };
        }
        objectTempIcons[dayID].temperatures.push(tempID);
        objectTempIcons[dayID].icons.push(iconID);
      });

      let i = 1;
      for (let day in objectTempIcons) {
        const tempsForEachDay = objectTempIcons[day].temperatures;
        const tempMaxForEachDay = Math.round(Math.max(...tempsForEachDay));
        const tempMinForEachDay = Math.round(Math.min(...tempsForEachDay));

        const tempsToRender = `${tempMaxForEachDay} °C / ${tempMinForEachDay} °C`;
        const tempsDaysDocument = document.querySelector(`.p-${i}-temp`);
        if (tempsDaysDocument) {
          tempsDaysDocument.innerText = tempsToRender;
        }
        i++;
      }
      let iconDay = 1;
      for (let day in objectTempIcons) {
        const iconsValue = objectTempIcons[day].icons[0];
        const iconsDocument = document.querySelector(`.icon-${iconDay}`);
        if (iconsDocument) {
          iconsDocument.src = `./assets/iconsForConditions/${iconsValue}.png`;
        }
        iconDay++;
      }
    });
  },

  usingCoordinatesLocation: function (resultsCoordinates) {
    const lonCompare = resultsCoordinates[0].lon;
    const latCompare = resultsCoordinates[0].lat;
    return latCompare, lonCompare;
  },

  searchingInputIntoLocation: function () {
    this.fetchingClimateData(
      document.querySelector(".card-searchingBar").value
    );
  },
};

document
  .querySelector(".card-searchingButton")
  .addEventListener("click", function () {
    SEARCHINGGLOBALCLIMATE.searchingInputIntoLocation();
  });

document
  .querySelector(".card-searchingBar")
  .addEventListener("keyup", function (event) {
    if (event.key == "Enter") {
      SEARCHINGGLOBALCLIMATE.searchingInputIntoLocation();
    }
  });
