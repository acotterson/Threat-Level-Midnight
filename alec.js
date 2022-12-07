// u1444779 8015815808
const https = require("https");
fsread = require("fs").promises;
fs = require("fs");
const axios = require("axios");

function parseSpecs(specs, stream) {
  let dataArray1 = specs.split("<strong>");
  let dataArray2 = dataArray1.map((item) => {
    let split = item.split("</strong>");
    if (split[0] !== "") {
      return { [split[0]]: split[1] };
    }
  });

  finalArray = dataArray2.map((item) => {
    if (item) {
      // console.log(item);
      let key = Object.keys(item)[0];
      let value = item[key];
      if (value) {
        value = value.replace(/<br>/g, "");
        value = value.replace(/<li>/g, "");
        value = value.replace(/<\/li>/g, "");
        value = value.replace(/<ul>/g, "");
        value = value.replace(/<\/ul>/g, "");
        value = value.replace(/'/g, '"');
        key = key.replace(/'/g, '"');
        key = key.replace(/:/g, "");
        key = key.replace(/®/g, "");
        return { [key]: value };
      }
    }
  });
  let retrieved = {
    processor: false,
    memory: false,
    graphics: false,
    directx: false,
    storage: false,
  };
  // console.log(finalArray);
  // find key Processor and report value
  finalArray.forEach((item) => {
    if (item) {
      let key = Object.keys(item)[0];
      if (key === "Processor" && retrieved.processor === false) {
        stream.write(item[key] + "\n");
        retrieved.processor = true;
      }
    }
  });
  // find key Memory and report value
  finalArray.forEach((item) => {
    if (item) {
      let key = Object.keys(item)[0];
      if (key === "Memory" && retrieved.memory === false) {
        stream.write(item[key] + "\n");
        retrieved.memory = true;
      }
    }
  });
  // find key Graphics and report value
  finalArray.forEach((item) => {
    if (item) {
      let key = Object.keys(item)[0];
      if (
        (key === "Graphics" || key === "Video Card") &&
        retrieved.graphics === false
      ) {
        stream.write(item[key] + "\n");
        retrieved.graphics = true;
      }
    }
  });
  // find key Graphics and report value
  finalArray.forEach((item) => {
    if (item) {
      let key = Object.keys(item)[0];
      if (key === "DirectX" && retrieved.directx === false) {
        stream.write(item[key] + "\n");
        retrieved.directx = true;
      }
    }
  });
  // find key Storage and report value
  finalArray.forEach((item) => {
    if (item) {
      let key = Object.keys(item)[0];
      if (
        (key === "Storage" || key === "Hard Disk Space") &&
        retrieved.storage === false
      ) {
        stream.write(item[key] + "\n");
        retrieved.storage = true;
      }
    }
  });
}

const delay = (ms = 5000) => new Promise((r) => setTimeout(r, ms));

const validIds = [];
async function main() {
  try {
    data = await fsread.readFile("steam_data.json", "utf8");
    for (let item of JSON.parse(data)) {
      validIds.push(item.appid);
    }
    getStuff(2000, validIds);
  } catch (err) {
    console.log(err);
  }
}

const getInSeries = async (promises) => {
  let results = [];
  for (let promise of promises) {
    results.push(await delay().then(() => promise).catch(err => console.log(err)));
  }
  return results;
};

// const getInParallel = async (promises) => Promise.all(promises);
async function getStuff(runs, validIds) {
  let idList = [];
  // console.log(validIds);
  let start = 0;
  while (runs > 0) {
    console.log(`${runs} runs left.`);
    idList = [];
    for (let i = start; i <= start + 1; i++) {
      idList.push(validIds[i]);
    }
    // console.log(`Working on: ${idList}`);
    const promises = idList.map((id) =>
      axios
        .get(`https://store.steampowered.com/api/appdetails?appids=${id}`)
        .then((res) => res.data)
        .catch((err) =>console.log(err))
    );
    const results = await getInSeries(promises);
    
    let stream = fs.createWriteStream("filterRes.txt", { flags: "a" });
    for (let item of results) {
      console.log(`Game ${Object.keys(item)}`);
      stream.write(`\nGame ${Object.keys(item)}:`);
      const game = item[Object.keys(item)].data;
      // stream.write(JSON.stringify(game.pc_requirements));
      // check for obvious recommended section
      if (game) {
        if (game.pc_requirements) {
          if (game.pc_requirements.recommended) {
            let dataArray = game.pc_requirements.recommended;
            stream.write("\nRecommended:\n");
            parseSpecs(dataArray, stream);
          }
          if (game.pc_requirements.minimum) {
            let dataArray = game.pc_requirements.minimum;
            if (dataArray.includes("\t\t\t")) {
              dataArray = dataArray
                .replace(/\t|<\/?p>|\n|<br ?\/?.|\r+|&reg;/g, "")
                .replace(/,( or)/g, "$1");
              let dataArray1 = dataArray.split("<strong>");
              let finalArray = dataArray1.map((item) => {
                let split = item.split("</strong>");
                if (split[0] !== "") {
                  let splitMore = split[1].split(",");
                  const [
                    Processor,
                    Memory,
                    Graphics,
                    OS,
                    Mouse,
                    Keyboard,
                    Internet,
                  ] = splitMore;
                  return {
                    Processor,
                    Memory,
                    Graphics,
                    OS,
                    Mouse,
                    Keyboard,
                    Internet,
                  };
                }
              });
              stream.write(finalArray);
              finalArray.splice(0, 1);
              stream.write("\nMinimum:" + "\n");
              stream.write(finalArray[0].Processor + "\n");
              stream.write(finalArray[0].Memory + "\n");
              stream.write(finalArray[0].Graphics + "\n");
              stream.write(finalArray[0].OS + "\n");
              // stream.write(finalArray[0].Mouse);
              // stream.write(finalArray[0].Keyboard);
              // stream.write(finalArray[0].Internet);
              stream.write("Recommended:" + "\n");
              stream.write(finalArray[1].Processor + "\n");
              stream.write(finalArray[1].Memory + "\n");
              stream.write(finalArray[1].Graphics + "\n");
              stream.write(finalArray[1].OS + "\n");
              // stream.write(finalArray[1].Mouse);
              // stream.write(finalArray[1].Keyboard);
              // stream.write(finalArray[1].Internet);
            } else {
              stream.write("\nMinimum:" + "\n");
              parseSpecs(dataArray, stream);
            }
          }
        }
      } else {
        stream.write("\nNo Game?\n");
      }
    }

    // stream.write(JSON.stringify(results));
    console.log("results > filterRes.txt");
    runs--;
    start += 2;
    console.log(`Batch starting with ${start}`);
  }
}

main();

// const gamesList = [];
// async function games() {
//   try {
//     data = await fsread.readFile("specRecommends.json", "utf8");
//     // const game = data[Object.keys(data)[0]];
//     // console.log(JSON.parse(data)[0].[0]);
//     gamesList.push(JSON.parse(data));
//     console.log(gamesList[0][1]);
//     for (let item of gamesList[0]) {
//       // console.log(item.pc_requirements);
//     //   recommended = item.pc_requirements;
//     //   recommended = JSON.parse(
//     //     `${JSON.stringify(recommended)
//     //       .replace(/"<[:</ >\w\\]+class=[\\\w"]+>/g, ",")
//     //       .replace(/("\w+"):/g, '"name":$1')
//     //       .replace(/{/g, "[")
//     //       .replace(/ *<br>(\\t)*<\/li>| {2,}/g, "")
//     //       .replace(/<li><strong>/g, '"],"')
//     //       .replace(/:<\/strong/g, '":')
//     //       .replace(/> /g, '["')
//     //       .replace(/<[\/\w><]+>/g, '"],')
//     //       .replace(/("[\w .]+),([\w .]+")/g, "$1 or$2")
//     //       .replace(/("name)/g, "{$1")
//     //       .replace(/,"}/g, "}]")
//     //       .replace(/,",/g, "},")
//     //       .replace(/(]?,"\w+) (\w+":)/g, "$1_$2")
//     //       .replace(/","]/g, '"')
//     //       .replace(/,(\w+): /g, ',"$1":["')
//     //       .replace(/>/g, '["')
//     //       .replace(/\n/g, "")
//     //       .replace(/\}\]( +)?\n?\[\{/g, ",")
//     //       .replace(/\]\n\[\]\n\[/g, ",")
//     //       .replace(/\] +?\[/g, ",")
//     //       .replace(/,(Requires a 64-bit processor)/g, ',"bits":["$1')
//     //       .replace(/"\} ?/g, '"]}')
//     //       .replace(/", "/g, '],"')
//     //       .replace(/(\w)\] ?/g, '$1"]')
//     //       .toLowerCase()}`
//     //   );
//     //   console.log(recommended);
//     }

//     // gamesList.push([Object.keys(data)[0]]);
//     // console.log(gamesList[0]);
//   } catch (err) {
//     console.log(err);
//   }
// }

// games();

// let thing = JSON.parse(
//   `[{"name":"minimum","Supported_OS":["Windows® 7 32/64-bit / Vista 32/64 / XP"],"Processor":["Pentium 4 3.0GHz"],"Memory":["1 GB"],"Graphics":["128 MB, Shader model 2.0, ATI 9600, NVidia 6600 or better"],"Hard_Drive":["At least 7.5 GB of free space"],"Sound_Card":["DirectX 9.0c compatible sound card"]},{"name":"recommended","Supported_OS":["Windows® 7 32/64-bit / Vista 32/64 / XP"],"Processor":["Intel core 2 duo 2.4GHz"],"Memory":["1 GB"],"Graphics":["Shader model 3.0, NVidia 7600, ATI X1600 or better"]}]`
// );

// const delay = (ms = 5000) => new Promise((r) => setTimeout(r, ms));

// const validIds = [];
// async function main() {
//   try {
//     data = await fsread.readFile("steam_data.json", "utf8");
//     for (let item of JSON.parse(data)) {
//       validIds.push(item.appid);
//     }
//     getStuff(100, validIds);
//   } catch (err) {
//     console.log(err);
//   }
// }

// const getInSeries = async (promises) => {
//   let results = [];
//   for (let promise of promises) {
//     results.push(await delay().then(() => promise));
//   }
//   return results;
// };

// // const getInParallel = async (promises) => Promise.all(promises);
// async function getStuff(runs, validIds) {
//   let strings = [];
//   console.log(validIds);
//   let start = 0;
//   while (runs > 0) {
//     console.log(`${runs} runs left.`);
//     strings = [];
//     for (let i = start; i <= start + 49; i++) {
//       strings.push(validIds[i]);
//     }
//     console.log(`Working on: ${strings}`);
//     const promises = strings.map((id) =>
//       axios
//         .get(`https://store.steampowered.com/api/appdetails?appids=${id}`)
//         .then((res) => res.data)
//     );
//     const results = await getInSeries(promises);
//     let stream = fs.createWriteStream("filterRes.txt", { flags: "a" });
//     stream.write(JSON.stringify(results));
//     console.log("results > filterRes.txt");
//     runs--;
//     start += 50;
//     console.log(`Batch starting with ${start}`);
//   }
// }

// main();

// const getInChunk = async function (chunkSize) {
//   let results = [];
//   let chunkPromises = [];
//   let chunkResults = [];
//   for (let id = 0; id < 100; id++) {
//     if (id % chunkPromises === 0) {
//       chunkPromises = [];
//       chunkResults.push(await Promise.all(chunkPromises));
//     } else {
//       chunkPromises.push(
//         axios.get(`https://store.steampowered.com/api/appdetails?appids=${id}`).then(res => res.data)
//       );
//     }
//   }
//   // last chunk
//   if (chunkPromises.length) {
//     chunkResults.push(await Promise.all(chunkPromises));
//   }
//   // flatten
//   chunkResults.forEach(chunk =>{
//     results = results.concat(chunk)
//   })
//   console.log(results)
//   return results;
// };

// async function main() {
//   const results = await getInChunk(5);
//   console.log(results);

// }
// main();

// let successful = 0;
// const dataFull = [];
// let unsuccessful = 0;
// console.log(thing);\
// for (let id = 0; id < 100; id++) {

//   let url = `https://store.steampowered.com/api/appdetails?appids=${id}`;
//   https.get(url, async (res) => {
// get json from steam api image.png http://store.steampowered.com/api/appdetails?appids=387990 log body
// try {
//   let data = "";

//   // A chunk of data has been received.
//   res.on("data", (chunk) => {
//     data += chunk;
//   });

// The whole response has been received. Print out the result.
// res.on("end", () => {
// const parsedData = JSON.parse(data);
// dataFull.push(data);
// const game = data[Object.keys(data)[0]];
// if (game.success) {
// console.log(game.data.release_date);
// let recommended = game.data.pc_requirements;
// console.log(JSON.stringify(recommended));
// dataFull.push(String(recommended));
// dataFull.push(JSON.stringify(recommended));
// recommended = JSON.parse(
//   `${JSON.stringify(recommended)
//     .replace(/"<[:</ >\w\\]+class=[\\\w"]+>/g, ",")
//     .replace(/("\w+"):/g, '"name":$1')
//     .replace(/{/g, "[")
//     .replace(/ *<br>(\\t)*<\/li>| {2,}/g, "")
//     .replace(/<li><strong>/g, '"],"')
//     .replace(/:<\/strong/g, '":')
//     .replace(/> /g, '["')
//     .replace(/<[\/\w><]+>/g, '"],')
//     .replace(/("[\w .]+),([\w .]+")/g, "$1 or$2")
//     .replace(/("name)/g, "{$1")
//     .replace(/,"}/g, "}]")
//     .replace(/,",/g, "},")
//     .replace(/(]?,"\w+) (\w+":)/g, "$1_$2")
//     .replace(/","]/g, '"')
//     .replace(/,(\w+): /g, ',"$1":["')
//     .replace(/>/g, '["')
//     .toLowerCase()}`
// );
//   console.log(recommended);
// console.log(recommended);
//   successful++;

// }
//       });
//     } catch (err) {
//       console.log(err);
//     }
//   });
// }
// console.log(successful);
// console.log(dataFull);

// alec ottersons job

// example return. some only return min specs and some items aren't included sometimes. Some are formatted extra different
// and will take different method: usually those are really old games. Depending how we proceed, maybe check date and if it's from more than 10 years ago call it good?
// Just randomly found and tested several games. Probably need a bigger sample size to get a better idea of the general patterns.

// [
//   {
//     name: "minimum",
//     OS: ["Windows 7"],
//     Processor: ["Intel Core 2 or AMD equivalent"],
//     Memory: ["1 GB RAM"],
//     Network: ["Broadband Internet connection"],
//     Storage: ["200 MB available space"],
//     "Additional Notes": [
//       "Network Bandwidth of 5Mbps for 540p or 3Mbps for 360p.",
//     ],
//   },
//   {
//     name: "recommended",
//     OS: ["Windows 10"],
//     Processor: [
//       "Intel Core I3+ or AMD equivalent recommended for HD 1080p playback",
//     ],
//     Memory: ["2 GB RAM"],
//     Network: ["Broadband Internet connection"],
//     Storage: ["500 MB available space"],
//     "Additional Notes": [
//       "Network Bandwidth of 12Mbps for 1080p or 8Mbps for 720p.",
//     ],
//   },
// ]
