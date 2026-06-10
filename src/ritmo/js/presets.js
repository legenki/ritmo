// RITMO — built-in presets.

const acidFlexingPreset = {
  seed: {
    simplex: 3135,
    number: 6540,
    random: 3760,
    fill: 146,
    stroke: 354
  },
  cnv: {
    ratio: "1:1",
    frame: 0,
    scale: {
      x: 100,
      y: 50
    },
    rotate: 180,
    offset: 0
  },
  form: {
    type: "stripes",
    stripe: {
      width: 35
    },
    amount: {
      value: 80
    },
    quality: {
      value: 50
    },
    amp: {
      x: 0,
      y: 70
    },
    freq: {
      x: 33,
      y: 99
    },
    speed: {
      x: 0,
      y: 5
    }
  },
  palette: {
    total: 5,
    base: ["#1e0326", "#f18f96", "#6702ff", "#ff6c08", "#a0f5ff"]
  },
  bg: {
    mode: "gradient",
    array: ["#ff6c08", "#6702ff", "#f18f96", "#1e0326", "#a0f5ff"],
    gradient: {
      angle: 90
    }
  },
  graphics: {
    fill: {
      mode: "palette",
      sort: "transition",
      array: ["#a0f5ff", "#f18f96", "#ff6c08", "#6702ff", "#1e0326"]
    },
    stroke: {
      mode: "none",
      sort: "random",
      array: ["#1e0326", "#f18f96", "#6702ff", "#ff6c08", "#a0f5ff"],
      weight: 1,
      dash: 1,
      gap: 2
    }
  },
  rec: {
    type: "mp4",
    length: {
      value: 8
    }
  }
};

const shimmeringExpansePreset = {
  seed: {
    simplex: 6926,
    number: 2781,
    random: 1343,
    fill: 242,
    stroke: 211
  },
  cnv: {
    ratio: "1:1",
    frame: 0,
    scale: {
      x: 139,
      y: 70
    },
    rotate: 150,
    offset: 0
  },
  form: {
    type: "waves",
    stripe: {
      width: 40
    },
    amount: {
      value: 90
    },
    quality: {
      value: 30
    },
    amp: {
      x: 0,
      y: 14
    },
    freq: {
      x: 47.5,
      y: 87.4
    },
    speed: {
      x: 0,
      y: 11
    }
  },
  palette: {
    total: 5,
    base: ["#000000", "#d617ff", "#ff0083", "#ff3e00", "#000000", "#ff9f80"]
  },
  bg: {
    mode: "single",
    array: ["#000000", "#ff0083", "#d617ff", "#ff3e00", "#000000"],
    gradient: {
      angle: 0
    }
  },
  graphics: {
    fill: {
      mode: "none",
      sort: "repeat",
      array: ["#000000", "#d617ff", "#ff0083", "#ff3e00", "#000000"]
    },
    stroke: {
      mode: "palette",
      sort: "transition",
      array: ["#000000", "#d617ff", "#ff0083", "#ff3e00", "#000000"],
      weight: 2,
      dash: 1,
      gap: 8
    }
  },
  rec: {
    type: "mp4",
    length: {
      value: 10
    }
  }
};

const toffeeMountainsPreset = {
  seed: {
    simplex: 8282,
    number: 9424,
    random: 4948,
    fill: 338,
    stroke: 172
  },
  cnv: {
    ratio: "1:1",
    frame: 0,
    scale: {
      x: 100,
      y: 76
    },
    rotate: 0,
    offset: 6
  },
  form: {
    type: "waves",
    stripe: {
      width: 50
    },
    amount: {
      value: 160
    },
    quality: {
      value: 55
    },
    amp: {
      x: 0,
      y: 34.8
    },
    freq: {
      x: 43.8,
      y: 94.7
    },
    speed: {
      x: 0,
      y: 10
    }
  },
  palette: {
    total: 5,
    base: ["#fbfdff", "#dec23b", "#6b7249", "#4c6278", "#35302a"]
  },
  bg: {
    mode: "gradient",
    array: ["#4c6278", "#fbfdff", "#6b7249", "#35302a", "#dec23b"],
    gradient: {
      angle: 0
    }
  },
  graphics: {
    fill: {
      mode: "palette",
      sort: "transition",
      array: ["#fbfdff", "#dec23b", "#6b7249", "#4c6278", "#35302a"]
    },
    stroke: {
      mode: "none",
      sort: "random",
      array: ["#fbfdff", "#dec23b", "#6b7249", "#4c6278", "#35302a"],
      weight: 2,
      dash: 0,
      gap: 20
    }
  },
  rec: {
    type: "mp4",
    length: {
      value: 10
    }
  }
};

const afterlifeAloePreset = {
  seed: {
    simplex: 3930,
    number: 9678,
    random: 4384,
    fill: 406,
    stroke: 199
  },
  cnv: {
    ratio: "1:1",
    frame: 0,
    scale: {
      x: 144,
      y: 66
    },
    rotate: 75,
    offset: 0
  },
  form: {
    type: "stripes",
    stripe: {
      width: 24
    },
    amount: {
      value: 60
    },
    quality: {
      value: 45
    },
    amp: {
      x: 0,
      y: 22.9
    },
    freq: {
      x: 26.6,
      y: 95.6
    },
    speed: {
      x: 0,
      y: 13.6
    }
  },
  palette: {
    total: 3,
    base: ["#3a212f", "#b54035", "#6aa700"]
  },
  bg: {
    mode: "single",
    array: ["#b54035", "#6aa700", "#3a212f"],
    gradient: {
      angle: 0
    }
  },
  graphics: {
    fill: {
      mode: "gradient",
      sort: "transition",
      array: ["#b54035", "#6aa700", "#3a212f"]
    },
    stroke: {
      mode: "gradient",
      sort: "transition",
      array: ["#b54035", "#3a212f", "#6aa700"],
      weight: 2,
      dash: 0,
      gap: 2
    }
  },
  rec: {
    type: "mp4",
    length: {
      value: 8
    }
  }
};

const confettiDynamicsPreset = {
  seed: {
    simplex: 3045,
    number: 7418,
    random: 2886,
    fill: 269,
    stroke: 199
  },
  cnv: {
    ratio: "1:1",
    frame: 0,
    scale: {
      x: 143,
      y: 149
    },
    rotate: 30,
    offset: 0
  },
  form: {
    type: "waves",
    stripe: {
      width: 70
    },
    amount: {
      value: 22
    },
    quality: {
      value: 25
    },
    amp: {
      x: 0,
      y: 20
    },
    freq: {
      x: 40,
      y: 25
    },
    speed: {
      x: 0,
      y: 5
    }
  },
  palette: {
    total: 4,
    base: ["#000000", "#ff0000", "#f1a495", "#1f7548"]
  },
  bg: {
    mode: "single",
    array: ["#000000", "#f1a495", "#ff0000", "#1f7548"],
    gradient: {
      angle: 0
    }
  },
  graphics: {
    fill: {
      mode: "none",
      sort: "transition",
      array: ["#000000", "#ff0000", "#f1a495", "#1f7548"]
    },
    stroke: {
      mode: "palette",
      sort: "repeat",
      array: ["#000000", "#ff0000", "#f1a495", "#1f7548"],
      weight: 20,
      dash: 1,
      gap: 73
    }
  },
  rec: {
    type: "mp4",
    length: {
      value: 30
    }
  }
};

const chromaticBlendPreset = {
  seed: {
    simplex: 3842,
    number: 1256,
    random: 665,
    fill: 277,
    stroke: 220
  },
  cnv: {
    ratio: "1:1",
    frame: 0,
    scale: {
      x: 190,
      y: 205
    },
    rotate: 55,
    offset: 2
  },
  form: {
    type: "stripes",
    stripe: {
      width: 50
    },
    amount: {
      value: 64
    },
    quality: {
      value: 2
    },
    amp: {
      x: 0,
      y: 10.3
    },
    freq: {
      x: 13,
      y: 76.5
    },
    speed: {
      x: 0,
      y: 30
    }
  },
  palette: {
    total: 5,
    base: ["#ffe9dd", "#d77000", "#713f96", "#304260", "#131918"]
  },
  bg: {
    mode: "gradient",
    array: ["#713f96", "#ffe9dd", "#304260", "#131918", "#d77000"],
    gradient: {
      angle: 0
    }
  },
  graphics: {
    fill: {
      mode: "gradient",
      sort: "random",
      array: ["#ffe9dd", "#d77000", "#713f96", "#304260", "#131918"]
    },
    stroke: {
      mode: "palette",
      sort: "random",
      array: ["#ffe9dd", "#d77000", "#713f96", "#304260", "#131918"],
      weight: 1,
      dash: 0,
      gap: 3
    }
  },
  rec: {
    type: "mp4",
    length: {
      value: 12
    }
  }
};

const colorOfFreedomPreset = {
  seed: {
    simplex: 3658,
    number: 5867,
    random: 3604,
    fill: 198,
    stroke: 212
  },
  cnv: {
    ratio: "1:1",
    frame: 0,
    scale: {
      x: 100,
      y: 120
    },
    rotate: -90,
    offset: 0
  },
  form: {
    type: "waves",
    stripe: {
      width: 54
    },
    amount: {
      value: 80
    },
    quality: {
      value: 15
    },
    amp: {
      x: 0,
      y: 9.3
    },
    freq: {
      x: 21.1,
      y: 53.8
    },
    speed: {
      x: 0,
      y: 40
    }
  },
  palette: {
    total: 3,
    base: ["#004bff", "#ffbd00", "#000000"]
  },
  bg: {
    mode: "gradient",
    array: ["#ffbd00", "#004bff", "#000000"],
    gradient: {
      angle: 180
    }
  },
  graphics: {
    fill: {
      mode: "none",
      sort: "repeat",
      array: ["#004bff", "#ffbd00", "#000000"]
    },
    stroke: {
      mode: "single",
      sort: "transition",
      array: ["#004bff", "#000000", "#ffbd00"],
      weight: 1,
      dash: 3,
      gap: 2
    }
  },
  rec: {
    type: "mp4",
    length: {
      value: 20
    }
  }
};

const pinkyNoodleAdventurePreset = {
  seed: {
    simplex: 3840,
    number: 9498,
    random: 4130,
    fill: 462,
    stroke: 343
  },
  cnv: {
    ratio: "1:1",
    frame: 0,
    scale: {
      x: 100,
      y: 110
    },
    rotate: 0,
    offset: 0
  },
  form: {
    type: "stripes",
    stripe: {
      width: 32
    },
    amount: {
      value: 25
    },
    quality: {
      value: 45
    },
    amp: {
      x: 0,
      y: 12
    },
    freq: {
      x: 32,
      y: 0
    },
    speed: {
      x: 0,
      y: 13
    }
  },
  palette: {
    total: 4,
    base: ["#ffb1fa", "#41835c", "#af4355", "#39263c"]
  },
  bg: {
    mode: "single",
    array: ["#41835c", "#af4355", "#ffb1fa", "#39263c"],
    gradient: {
      angle: 0
    }
  },
  graphics: {
    fill: {
      mode: "single",
      sort: "repeat",
      array: ["#ffb1fa", "#41835c", "#af4355", "#39263c"]
    },
    stroke: {
      mode: "single",
      sort: "repeat",
      array: ["#ffb1fa", "#41835c", "#af4355", "#39263c"],
      weight: 1,
      dash: 0,
      gap: 2
    }
  },
  rec: {
    type: "mp4",
    length: {
      value: 10
    }
  }
};

const candyFieldsPreset = {
  seed: {
    simplex: 8061,
    number: 3439,
    random: 1034,
    fill: 358,
    stroke: 263
  },
  cnv: {
    ratio: "1:1",
    frame: 0,
    scale: {
      x: 100,
      y: 100
    },
    rotate: 0,
    offset: 15
  },
  form: {
    type: "waves",
    stripe: {
      width: 50
    },
    amount: {
      value: 20
    },
    quality: {
      value: 45
    },
    amp: {
      x: 0,
      y: 20
    },
    freq: {
      x: 22,
      y: 90
    },
    speed: {
      x: 0,
      y: 18
    }
  },
  palette: {
    total: 5,
    base: ["#2d3438", "#536c4c", "#e6655c", "#e796b1", "#f3a472"]
  },
  bg: {
    mode: "gradient",
    array: ["#e796b1", "#f3a472", "#e6655c", "#2d3438", "#536c4c"],
    gradient: {
      angle: 0
    }
  },
  graphics: {
    fill: {
      mode: "palette",
      sort: "repeat",
      array: ["#2d3438", "#536c4c", "#e6655c", "#e796b1", "#f3a472"]
    },
    stroke: {
      mode: "single",
      sort: "random",
      array: ["#2d3438", "#536c4c", "#e6655c", "#e796b1", "#f3a472"],
      weight: 2,
      dash: 0,
      gap: 20
    }
  },
  rec: {
    type: "mp4",
    length: {
      value: 30
    }
  }
};

const geometryAddictionPreset = {
  seed: {
    simplex: 1929,
    number: 8348,
    random: 4716,
    fill: 274,
    stroke: 161
  },
  cnv: {
    ratio: "1:1",
    frame: 0,
    scale: {
      x: 150,
      y: 80
    },
    rotate: 135,
    offset: 0
  },
  form: {
    type: "stripes",
    stripe: {
      width: 40
    },
    amount: {
      value: 125
    },
    quality: {
      value: 5
    },
    amp: {
      x: 0,
      y: 25
    },
    freq: {
      x: 40,
      y: 88.6
    },
    speed: {
      x: 0,
      y: 45
    }
  },
  palette: {
    total: 4,
    base: ["#fffcef", "#f88dc0", "#54b2be", "#1f8ac5", "#625643", "#443330"]
  },
  bg: {
    mode: "gradient",
    array: ["#54b2be", "#f88dc0", "#fffcef", "#1f8ac5"],
    gradient: {
      angle: 0
    }
  },
  graphics: {
    fill: {
      mode: "single",
      sort: "repeat",
      array: ["#fffcef", "#f88dc0", "#54b2be", "#1f8ac5"]
    },
    stroke: {
      mode: "single",
      sort: "transition",
      array: ["#f88dc0", "#1f8ac5", "#54b2be", "#fffcef"],
      weight: 2,
      dash: 0,
      gap: 2
    }
  },
  rec: {
    type: "mp4",
    length: {
      value: 10
    }
  }
};

const neoDreamPreset = {
  seed: {
    simplex: 3295,
    number: 2622,
    random: 930,
    fill: 341,
    stroke: 193
  },
  cnv: {
    ratio: "1:1",
    frame: 0,
    scale: {
      x: 157,
      y: 148
    },
    rotate: 75,
    offset: 0
  },
  form: {
    type: "waves",
    stripe: {
      width: 50
    },
    amount: {
      value: 200
    },
    quality: {
      value: 35
    },
    amp: {
      x: 0,
      y: 16.6
    },
    freq: {
      x: 72,
      y: 100
    },
    speed: {
      x: 0,
      y: 25
    }
  },
  palette: {
    total: 6,
    base: ["#232b2e", "#1f2c65", "#761dab", "#bb28ff", "#f935d1", "#ff9aea"]
  },
  bg: {
    mode: "single",
    array: ["#232b2e", "#761dab", "#ff9aea", "#1f2c65", "#bb28ff", "#f935d1"],
    gradient: {
      angle: 0
    }
  },
  graphics: {
    fill: {
      mode: "palette",
      sort: "transition",
      array: ["#232b2e", "#1f2c65", "#761dab", "#bb28ff", "#f935d1", "#ff9aea"]
    },
    stroke: {
      mode: "none",
      sort: "random",
      array: ["#232b2e", "#1f2c65", "#761dab", "#bb28ff", "#f935d1", "#ff9aea"],
      weight: 2,
      dash: 0,
      gap: 20
    }
  },
  rec: {
    type: "mp4",
    length: {
      value: 10
    }
  }
};

const orientalSynergyPreset = {
  seed: {
    simplex: 3386,
    number: 297,
    random: 214,
    fill: 380,
    stroke: 159
  },
  cnv: {
    ratio: "1:1",
    frame: 0,
    scale: {
      x: 182,
      y: 70
    },
    rotate: 0,
    offset: 3
  },
  form: {
    type: "waves",
    stripe: {
      width: 34
    },
    amount: {
      value: 70
    },
    quality: {
      value: 45
    },
    amp: {
      x: 0,
      y: 18.4
    },
    freq: {
      x: 32,
      y: 64.7
    },
    speed: {
      x: 0,
      y: 16.6
    }
  },
  palette: {
    total: 3,
    base: ["#171c14", "#103a49", "#ac3551", "#c9481e", "#b09103", "#ffffff"]
  },
  bg: {
    mode: "single",
    array: ["#171c14", "#ac3551", "#103a49"],
    gradient: {
      angle: 0
    }
  },
  graphics: {
    fill: {
      mode: "palette",
      sort: "transition",
      array: ["#171c14", "#103a49", "#ac3551"]
    },
    stroke: {
      mode: "single",
      sort: "repeat",
      array: ["#171c14", "#103a49", "#ac3551"],
      weight: 2,
      dash: 0,
      gap: 18
    }
  },
  rec: {
    type: "mp4",
    length: {
      value: 5
    }
  }
};

const retrowaveRecordsPreset = {
  seed: {
    simplex: 5667,
    number: 6058,
    random: 3309,
    fill: 544,
    stroke: 263
  },
  cnv: {
    ratio: "1:1",
    frame: 0,
    scale: {
      x: 100,
      y: 90
    },
    rotate: 0,
    offset: 0
  },
  form: {
    type: "stripes",
    stripe: {
      width: 70
    },
    amount: {
      value: 8
    },
    quality: {
      value: 45
    },
    amp: {
      x: 0,
      y: 35
    },
    freq: {
      x: 14,
      y: 96.5
    },
    speed: {
      x: 0,
      y: 20
    }
  },
  palette: {
    total: 4,
    base: ["#ffdcf9", "#ffb73f", "#ff3377", "#3cabab"]
  },
  bg: {
    mode: "gradient",
    array: ["#3cabab", "#ffb73f", "#ffdcf9", "#ff3377"],
    gradient: {
      angle: 0
    }
  },
  graphics: {
    fill: {
      mode: "palette",
      sort: "transition",
      array: ["#ffdcf9", "#ffb73f", "#ff3377", "#3cabab"]
    },
    stroke: {
      mode: "palette",
      sort: "transition",
      array: ["#ffdcf9", "#ffb73f", "#ff3377", "#3cabab"],
      weight: 2,
      dash: 0,
      gap: 20
    }
  },
  rec: {
    type: "mp4",
    length: {
      value: 15
    }
  }
};

const theSwingMachinePreset = {
  seed: {
    simplex: 4384,
    number: 1952,
    random: 1194,
    fill: 460,
    stroke: 299
  },
  cnv: {
    ratio: "1:1",
    frame: 0,
    scale: {
      x: 200,
      y: 250
    },
    rotate: 45,
    offset: 12
  },
  form: {
    type: "stripes",
    stripe: {
      width: 45
    },
    amount: {
      value: 50
    },
    quality: {
      value: 8
    },
    amp: {
      x: 0,
      y: 14
    },
    freq: {
      x: 27.5,
      y: 84.7
    },
    speed: {
      x: 0,
      y: 12
    }
  },
  palette: {
    total: 5,
    base: ["#003cb5", "#021f0e", "#232f2c", "#2a706f", "#88c53c", "#00f58c"]
  },
  bg: {
    mode: "gradient",
    array: ["#2a706f", "#88c53c", "#021f0e", "#003cb5", "#232f2c"],
    gradient: {
      angle: 0
    }
  },
  graphics: {
    fill: {
      mode: "palette",
      sort: "transition",
      array: ["#88c53c", "#021f0e", "#003cb5", "#232f2c", "#2a706f"]
    },
    stroke: {
      mode: "single",
      sort: "transition",
      array: ["#003cb5", "#021f0e", "#232f2c", "#2a706f", "#88c53c"],
      weight: 2,
      dash: 0,
      gap: 83
    }
  },
  rec: {
    type: "mp4",
    length: {
      value: 8
    }
  }
};

const ultraTonesTransitionPreset = {
  seed: {
    simplex: 4929,
    number: 1931,
    random: 1068,
    fill: 481,
    stroke: 291
  },
  cnv: {
    ratio: "1:1",
    frame: 0,
    scale: {
      x: 150,
      y: 110
    },
    rotate: -135,
    offset: 0
  },
  form: {
    type: "waves",
    stripe: {
      width: 25
    },
    amount: {
      value: 15
    },
    quality: {
      value: 40
    },
    amp: {
      x: 0,
      y: 14.8
    },
    freq: {
      x: 0,
      y: 43.8
    },
    speed: {
      x: 0,
      y: 25
    }
  },
  palette: {
    total: 5,
    base: ["#121518", "#393d77", "#ac5593", "#da4c17", "#ef8400"]
  },
  bg: {
    mode: "single",
    array: ["#121518", "#ac5593", "#da4c17", "#ef8400", "#393d77"],
    gradient: {
      angle: 0
    }
  },
  graphics: {
    fill: {
      mode: "palette",
      sort: "transition",
      array: ["#121518", "#393d77", "#ac5593", "#da4c17", "#ef8400"]
    },
    stroke: {
      mode: "palette",
      sort: "random",
      array: ["#121518", "#393d77", "#ac5593", "#da4c17", "#ef8400"],
      weight: 2,
      dash: 0,
      gap: 2
    }
  },
  rec: {
    type: "mp4",
    length: {
      value: 15
    }
  }
};

const gradientOfTranquilityPreset = {
  seed: {
    simplex: 2569,
    number: 2850,
    random: 1457,
    fill: 208,
    stroke: 209
  },
  cnv: {
    ratio: "1:1",
    frame: 0,
    scale: {
      x: 203,
      y: 105
    },
    rotate: 0,
    offset: 0
  },
  form: {
    type: "waves",
    stripe: {
      width: 47
    },
    amount: {
      value: 24
    },
    quality: {
      value: 45
    },
    amp: {
      x: 0,
      y: 9.3
    },
    freq: {
      x: 38.4,
      y: 72
    },
    speed: {
      x: 0,
      y: 12
    }
  },
  palette: {
    total: 4,
    base: ["#291f30", "#823231", "#53afb3", "#c4e1d1"]
  },
  bg: {
    mode: "single",
    array: ["#291f30", "#53afb3", "#823231", "#c4e1d1"],
    gradient: {
      angle: 180
    }
  },
  graphics: {
    fill: {
      mode: "palette",
      sort: "transition",
      array: ["#291f30", "#823231", "#53afb3", "#c4e1d1"]
    },
    stroke: {
      mode: "single",
      sort: "transition",
      array: ["#823231", "#291f30", "#53afb3", "#c4e1d1"],
      weight: 2,
      dash: 1,
      gap: 4
    }
  },
  rec: {
    type: "mp4",
    length: {
      value: 20
    }
  }
};

const hippieDaysPreset = {
  seed: {
    simplex: 3295,
    number: 5359,
    random: 3371,
    fill: 236,
    stroke: 260
  },
  cnv: {
    ratio: "1:1",
    frame: 0,
    scale: {
      x: 150,
      y: 150
    },
    rotate: 115,
    offset: 0
  },
  form: {
    type: "waves",
    stripe: {
      width: 41
    },
    amount: {
      value: 55
    },
    quality: {
      value: 45
    },
    amp: {
      x: 0,
      y: 4.8
    },
    freq: {
      x: 63.8,
      y: 65.6
    },
    speed: {
      x: 0,
      y: 21.1
    }
  },
  palette: {
    total: 6,
    base: ["#2a3232", "#71486b", "#b168b8", "#eea156", "#ffd7fc", "#ffffff"]
  },
  bg: {
    mode: "single",
    array: ["#eea156", "#ffffff", "#b168b8", "#2a3232", "#ffd7fc", "#71486b"],
    gradient: {
      angle: 0
    }
  },
  graphics: {
    fill: {
      mode: "palette",
      sort: "repeat",
      array: ["#2a3232", "#71486b", "#b168b8", "#eea156", "#ffd7fc", "#ffffff"]
    },
    stroke: {
      mode: "single",
      sort: "transition",
      array: ["#2a3232", "#71486b", "#b168b8", "#eea156", "#ffd7fc", "#ffffff"],
      weight: 1,
      dash: 0,
      gap: 2
    }
  },
  rec: {
    type: "mp4",
    length: {
      value: 15
    }
  }
};

const analogMarsPreset = {
  seed: {
    simplex: 3023,
    number: 4642,
    random: 2085,
    fill: 469,
    stroke: 205
  },
  cnv: {
    ratio: "1:1",
    frame: 0,
    scale: {
      x: 100,
      y: 70
    },
    rotate: 0,
    offset: 8
  },
  form: {
    type: "stripes",
    stripe: {
      width: 40
    },
    amount: {
      value: 28
    },
    quality: {
      value: 12
    },
    amp: {
      x: 0,
      y: 19.6
    },
    freq: {
      x: 32.9,
      y: 92
    },
    speed: {
      x: 0,
      y: 11.1
    }
  },
  palette: {
    total: 2,
    base: ["#e24c3d", "#291c1c"]
  },
  bg: {
    mode: "gradient",
    array: ["#e24c3d", "#291c1c"],
    gradient: {
      angle: 180
    }
  },
  graphics: {
    fill: {
      mode: "single",
      sort: "transition",
      array: ["#e24c3d", "#291c1c"]
    },
    stroke: {
      mode: "palette",
      sort: "transition",
      array: ["#e24c3d", "#291c1c"],
      weight: 1,
      dash: 0,
      gap: 51
    }
  },
  rec: {
    type: "mp4",
    length: {
      value: 10
    }
  }
};

const particlesTrailsPreset = {
  seed: {
    simplex: 5201,
    number: 3183,
    random: 2110,
    fill: 366,
    stroke: 248
  },
  cnv: {
    ratio: "1:1",
    frame: 0,
    scale: {
      x: 100,
      y: 146
    },
    rotate: 0,
    offset: 0
  },
  form: {
    type: "stripes",
    stripe: {
      width: 1
    },
    amount: {
      value: 22
    },
    quality: {
      value: 45
    },
    amp: {
      x: 0,
      y: 13
    },
    freq: {
      x: 34.8,
      y: 27.5
    },
    speed: {
      x: 0,
      y: 9
    }
  },
  palette: {
    total: 5,
    base: ["#14320b", "#1c3e6f", "#afb5af", "#ae2222", "#f5cbec"]
  },
  bg: {
    mode: "single",
    array: ["#afb5af", "#14320b", "#1c3e6f", "#f5cbec", "#ae2222"],
    gradient: {
      angle: 0
    }
  },
  graphics: {
    fill: {
      mode: "single",
      sort: "transition",
      array: ["#14320b", "#1c3e6f", "#afb5af", "#ae2222", "#f5cbec"]
    },
    stroke: {
      mode: "gradient",
      sort: "repeat",
      array: ["#14320b", "#1c3e6f", "#afb5af", "#ae2222", "#f5cbec"],
      weight: 20,
      dash: 1,
      gap: 100
    }
  },
  rec: {
    type: "mp4",
    length: {
      value: 15
    }
  }
};

const floatingRainbowPreset = {
  seed: {
    simplex: 1207,
    number: 8765,
    random: 5967,
    fill: 380,
    stroke: 227
  },
  cnv: {
    ratio: "1:1",
    frame: 0,
    scale: {
      x: 185,
      y: 181
    },
    rotate: 0,
    offset: 0
  },
  form: {
    type: "waves",
    stripe: {
      width: 8
    },
    amount: {
      value: 55
    },
    quality: {
      value: 45
    },
    amp: {
      x: 0,
      y: 16.6
    },
    freq: {
      x: 24.8,
      y: 80.2
    },
    speed: {
      x: 0,
      y: 13.9
    }
  },
  palette: {
    total: 4,
    base: ["#000000", "#0940ff", "#e774ff", "#e82125", "#018f8f", "#eee2aa"]
  },
  bg: {
    mode: "single",
    array: ["#000000", "#e774ff", "#0940ff", "#e82125"],
    gradient: {
      angle: 0
    }
  },
  graphics: {
    fill: {
      mode: "palette",
      sort: "transition",
      array: ["#e82125", "#e774ff", "#0940ff", "#000000"]
    },
    stroke: {
      mode: "palette",
      sort: "repeat",
      array: ["#0940ff", "#000000", "#e774ff", "#e82125"],
      weight: 9,
      dash: 0,
      gap: 49
    }
  },
  rec: {
    type: "mp4",
    length: {
      value: 15
    }
  }
};

export const PRESETS = {
  acidFlexing: acidFlexingPreset,
  shimmeringExpanse: shimmeringExpansePreset,
  toffeeMountains: toffeeMountainsPreset,
  afterlifeAloe: afterlifeAloePreset,
  confettiDynamics: confettiDynamicsPreset,
  chromaticBlend: chromaticBlendPreset,
  colorOfFreedom: colorOfFreedomPreset,
  pinkyNoodleAdventure: pinkyNoodleAdventurePreset,
  candyFields: candyFieldsPreset,
  geometryAddiction: geometryAddictionPreset,
  neoDream: neoDreamPreset,
  orientalSynergy: orientalSynergyPreset,
  retrowaveRecords: retrowaveRecordsPreset,
  theSwingMachine: theSwingMachinePreset,
  ultraTonesTransition: ultraTonesTransitionPreset,
  gradientOfTranquility: gradientOfTranquilityPreset,
  hippieDays: hippieDaysPreset,
  analogMars: analogMarsPreset,
  particlesTrails: particlesTrailsPreset,
  floatingRainbow: floatingRainbowPreset,
};
