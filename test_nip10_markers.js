// Test NIP-10 marker parsing
const rootEventId = "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3";

// Test events with proper NIP-10 markers
const testEvents = [
  {
      "content": "Frankly, that's all everyone needs to know",
      "created_at": 1753721614,
      "id": "3257dc9a7be06086d9b8f05193c3cf859dced2e264ec670a4493c9fa4e55d94c",
      "kind": 1,
      "pubkey": "42666b2f164c97609faa1c8deb464396aceca253cbef480a51e27fc6995a2444",
      "sig": "1b220015596d244060869a99c89d19c4c06031195c3ca9be0dfc08e06b57b0d455862fb522117a59442465c82915f9676106f560db69428296e76e280f53b75e",
      "tags": [
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "wss://relay.primal.net",
              "root"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d",
              "",
              "mention"
          ]
      ]
  },
  {
      "content": "The only thing stable is the fables",
      "created_at": 1753721785,
      "id": "f321193490741aa772ce0eaaa39c0b79ea01940a16f6796d53433a8c850bc630",
      "kind": 1,
      "pubkey": "50de492cfe5472450df1a0176fdf6d915e97cb5d9f8d3eccef7d25ff0a8871de",
      "sig": "0a6a1de43932b83dfe0d111cb983ff06037e2ddfb19b04e41a6637e0371e6d73ae05781bcc99ac9adf06cc90947f85d9ef8c0aeb83e60d902ed86f3e892019ef",
      "tags": [
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "",
              "root"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ]
      ]
  },
  {
      "content": "Gold is not as stable as some people imagine...",
      "created_at": 1753721870,
      "id": "02e99b886c71984d11e37611875c9279a57bcdf3f1efc54689ff56bb91e0f2fa",
      "kind": 1,
      "pubkey": "773094538c10a09ce17bf7f2a164c2731a46c34cf9c80fa6c260c5cfcdb4bab6",
      "sig": "9f78f2da99bb3a25a7cab789d9b8b34861cfc5b12fbf3c7946bc957477748f1aa243741b7db85d2ca448ab937e12e0e0503e14c37aed30e91acead1d8d92b44d",
      "tags": [
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "wss://relay.primal.net",
              "root"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ],
          [
              "r",
              "wss://relay.primal.net/"
          ],
          [
              "r",
              "wss://lunchbox.sandwich.farm/",
              "write"
          ],
          [
              "r",
              "wss://nostr.myshosholoza.co.za/"
          ],
          [
              "r",
              "wss://nostr.stakey.net/",
              "write"
          ],
          [
              "r",
              "wss://premium.primal.net/"
          ]
      ]
  },
  {
      "content": "This. \n\nGold is the stable depreciating asset the dollar wishes it could be. ",
      "created_at": 1753721974,
      "id": "5cc429882ea0fad4774ab4d88b090c0c7c9ac0d102361fc3c39d9651b07cf32e",
      "kind": 1,
      "pubkey": "ce3c305d4f6bde1060bc3193e1f18f3619dbbd993082da5838fd74491ea1de6b",
      "sig": "fe2553920d7ed435c1f503235b5b3ba8d3452f1940929decdcfe7ffe8c1265e823456b17591f5dde51e8014cdaa83f7d2e6e8f92d0a10ba019c16bfc4fb0e4fe",
      "tags": [
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "",
              "root"
          ],
          [
              "e",
              "02e99b886c71984d11e37611875c9279a57bcdf3f1efc54689ff56bb91e0f2fa",
              "",
              "reply"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ],
          [
              "p",
              "773094538c10a09ce17bf7f2a164c2731a46c34cf9c80fa6c260c5cfcdb4bab6"
          ]
      ]
  },
  {
      "content": "I still have some physical gold, I'd say almost symbolically at this point. Should one keep it in your opinion?",
      "created_at": 1753722197,
      "id": "9049b613c04e0900bea365c188487a58db442ac26bacbdb384021df1257a5d2c",
      "kind": 1,
      "pubkey": "15f70ebd30f69b85bba87c3ec45645300dc2835a6dac235fdf8143cab5e9282c",
      "sig": "663f2c5eed8d7e97ba98745db0705e548f05d4123c53d95b21578e80fad61aa0c85252d3030b1f4260f261a0db4a3f60cdc7ca8303c8f41a9cfcd0121f264872",
      "tags": [
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d",
              "",
              "mention"
          ],
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "",
              "root"
          ]
      ]
  },
  {
      "content": "in a nutshell, yes.",
      "created_at": 1753722390,
      "id": "6989237c46c9909e13becf87a74ce89d683572877559b67cee4d5afe72797225",
      "kind": 1,
      "pubkey": "d40d53f353c5d187a5bb35b787b07e7f064204af34140b9a141dd4f366f639d2",
      "sig": "fad2a2b0299345faa1131a618a5c6f6f1ccaff04dbaa97035f93d4a35ba988bd987705bd4697ee64fd637bdd716f769d513c3eff207b91a7ddcad2ba2d43b03e",
      "tags": [
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "",
              "root"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ]
      ]
  },
  {
      "content": "I broadly agree but I do think gold outperformed the actual rate of inflation (rather than the \"official\" one) in the last two decades, albeit not as much as bitcoin of course.",
      "created_at": 1753722546,
      "id": "d5fb24f21fb4f2ca310059e1d2f2a1e3104ac790de4f6a4f01dd619780fd3c7c",
      "kind": 1,
      "pubkey": "1d77cae575a8f73ab9e6263913fe78e3a79f40ee25abd72b71ee5d38061c7e4a",
      "sig": "068bf2ecdf3493ce88dc6156a9ca8a26eced300222be86e47efc456f04ebfc820cbed1fd2fab487de93c4bb65445045e3aca467368ad4a5eb3a66a7514e4a795",
      "tags": [
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d",
              "wss://relay.primal.net"
          ],
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "wss://relay.primal.net",
              "root",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ]
      ]
  },
  {
      "content": "No lies detected ",
      "created_at": 1753723643,
      "id": "d9b9ef1cfd4113d47f8124a7c644f72847bdad8a1fd4fbda2f9b1e791724dac7",
      "kind": 1,
      "pubkey": "ff2e412319f01788687a63de3248c2e9fac3f2ad15e3d621e2b42275cacb9ecd",
      "sig": "61f0cff5c0219b6e44e34664df3f7b85fb923f98ae74f05f05c75b5974963cccd6f59bfe96d80bb5ebef19c28e930f5fda3997e23f7154a99e9740f6b3eea3fa",
      "tags": [
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d",
              "",
              "mention"
          ],
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "",
              "root"
          ]
      ]
  },
  {
      "content": "So I should get a second job to make more dollars and then spend them as fast as I can on real things like a nicer car so maybe I can drive for uber between shifts?",
      "created_at": 1753725433,
      "id": "d57f16e0979a0e8640da3286190abb9b38a924fd052d2737e6ca0fd6f866193e",
      "kind": 1,
      "pubkey": "2248fe0518a40ef52013abd98602bfb7110d5f544d43f56fe5522e6273582fdb",
      "sig": "2c998239b0b0de6c3463580a44ccafdd536b4584af1eff6f602a9c64f2ed0a0e966e074efc23d4224b1a32b9b4781d04e719c3015058d8ac91231d5b26b4f9c6",
      "tags": [
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "wss://relay.primal.net",
              "root"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d",
              "",
              "mention"
          ]
      ]
  },
  {
      "content": "I will keep mine until normies start begging for Bitcoin. My physical is strictly to bribe the boarder guards as I make my way across the boarder with my full life savings on a cold card in my rectum (I know i could just memorize the seed but that story wouldn’t be nearly as interesting to my grandkids). ",
      "created_at": 1753725613,
      "id": "bd47e8a8fa3f9fdbfa03599426bff7013d7d42fe881ecab4b5536bad161bd297",
      "kind": 1,
      "pubkey": "2248fe0518a40ef52013abd98602bfb7110d5f544d43f56fe5522e6273582fdb",
      "sig": "9e1eaaf29969407ba8604b21ad456663bd82a6f3438cd1d0bfe7dabea8f47dab1c5b9a0842d446938f39cfe91f63865a468c2e87049cb74fc899b32189ee41a4",
      "tags": [
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "",
              "root"
          ],
          [
              "e",
              "9049b613c04e0900bea365c188487a58db442ac26bacbdb384021df1257a5d2c",
              "wss://relay.primal.net",
              "reply"
          ],
          [
              "p",
              "15f70ebd30f69b85bba87c3ec45645300dc2835a6dac235fdf8143cab5e9282c",
              "",
              "mention"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d",
              "",
              "mention"
          ]
      ]
  },
  {
      "content": "I wouldn't say that gold is stable. Just inflates less than fiat.",
      "created_at": 1753726467,
      "id": "77037d491a37c8404812d85fc2e7d4f56d510b70006aaceedc08fcaff8ce9a75",
      "kind": 1,
      "pubkey": "f901616f00a63f4f9c7881d4871a03df3d4cee7291eafd7adcbeea7c95c58e27",
      "sig": "cef392b7cc155ae4269f95aa891070f9421f77510861983f2ad1c60ac4a89e092a495b1c2276c4c30265fc2991644d38ce7baa358c79bf88dc0931bb40326bb9",
      "tags": [
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "",
              "root"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ]
      ]
  },
  {
      "content": "Regarding gold's stability over millennia, here is ChatGPT's response:\n \nhttps://blossom.primal.net/df54f05d2a5bdbae0f4cf657c4e464963aaab22b1597e4b778c38d4121012f06.png \n",
      "created_at": 1753728058,
      "id": "0c7ee382c48135b081434911ef43a4415ac8143e4c22b6920e12d8a750290dd2",
      "kind": 1,
      "pubkey": "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d",
      "sig": "bd6dd0451796bcbf1d8416d1b935c2150c9f40c4e880e804e8f37779d028e2648b05ba8590f529d2757bbcb57ab4c558ffaf11bface7555f48977f4d14b79c51",
      "tags": [
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "wss://relay.primal.net",
              "root"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ],
          [
              "r",
              "wss://knostr.neutrine.com/"
          ],
          [
              "r",
              "wss://misskey.04.si/"
          ],
          [
              "r",
              "wss://premium.primal.net/"
          ],
          [
              "r",
              "wss://purplepag.es/"
          ],
          [
              "r",
              "wss://relay.nostr.band/"
          ],
          [
              "r",
              "wss://relay.primal.net/"
          ]
      ]
  },
  {
      "content": "It's about to be inflated big time once scientists connected to the Jesuit Order can figure out how to affordably inflate gold by turning some metal into gold.",
      "created_at": 1753728649,
      "id": "018fa4d6a669bf4d89bc43fb798a23f7aa8c645f54980f05c364feb142cff4d0",
      "kind": 1,
      "pubkey": "d9a329afabb263a8af216838eb45e1f04cc3000704464947c4b907e1bef580d7",
      "sig": "34458fa1815b52a3fc9989f115917abab187b49ff1b2217fbed732d7ea0dfb0710d46c5cd6330888ea93a1cc2008cbf91527b5a8b0b9c80b0b6a6ae3f8cb39bc",
      "tags": [
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "wss://atlas.nostr.land",
              "root"
          ],
          [
              "e",
              "77037d491a37c8404812d85fc2e7d4f56d510b70006aaceedc08fcaff8ce9a75",
              "wss://atlas.nostr.land",
              "reply"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ],
          [
              "p",
              "f901616f00a63f4f9c7881d4871a03df3d4cee7291eafd7adcbeea7c95c58e27"
          ]
      ]
  },
  {
      "content": "2 More Monetary Truths:\n\nGoing forward...\n\n1. A.l. will accelerate Bitcoin appreciation.\n\n2. A.I. will accelerate fiat depreciation.",
      "created_at": 1753729486,
      "id": "e9331f503b855468a3ce380139a2f758d417200efa5b156ff8e94890131532f8",
      "kind": 1,
      "pubkey": "f9a2580977f9f25b8eb590ee0b5419e783a2af9d7669906db3755da9b769f4b9",
      "sig": "0bf944658e878bb359b1fb4a4a4337a266369ba1882fe23d998241011f19b5b2b3f0271c019417f8edb82d5b501ac0c1b59d496ca4b84ede3f9c614df613c27b",
      "tags": [
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "wss://relay.primal.net",
              "root"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d",
              "",
              "mention"
          ]
      ]
  },
  {
      "content": "💯",
      "created_at": 1753730330,
      "id": "a494675aee012dc8ae2d92c39c77f3e73a173aacb0ea97d5c7076ba7ed7a1c77",
      "kind": 1,
      "pubkey": "f901616f00a63f4f9c7881d4871a03df3d4cee7291eafd7adcbeea7c95c58e27",
      "sig": "1fc91ee6d0303f977e6cd39fc52734f411adcc363157b35ea092a852ec3eebdf95e302f1d292838144c576e25edb34dc09146f0b3aea0db1f80092d305ea898b",
      "tags": [
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "wss://atlas.nostr.land",
              "root"
          ],
          [
              "e",
              "018fa4d6a669bf4d89bc43fb798a23f7aa8c645f54980f05c364feb142cff4d0",
              "",
              "reply"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ],
          [
              "p",
              "d9a329afabb263a8af216838eb45e1f04cc3000704464947c4b907e1bef580d7"
          ]
      ]
  },
  {
      "content": "Amazing \n\n",
      "created_at": 1753735316,
      "id": "2b67db187c98368711baa8728045d11e94e9abe6095e272f6ba665599db67c85",
      "kind": 1,
      "pubkey": "4046c3ebca3e66e52ffe8a951f13951fc497d83b0388968b57f4776c00b55ae9",
      "sig": "dfce14277387f15fd5067112459f8381cb9f1247f65df0f3572319a98a1ae2f62f0cc0d79ca09fb76f623b81cc50577dd927ff7de936eb73a39aa027ed08a1fa",
      "tags": [
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d",
              "wss://relay.primal.net"
          ],
          [
              "e",
              "0c7ee382c48135b081434911ef43a4415ac8143e4c22b6920e12d8a750290dd2",
              "wss://relay.primal.net",
              "reply",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ],
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "wss://relay.primal.net",
              "root",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ]
      ]
  },
  {
      "content": "Bribing the guards with a shiny rock to make your escape is cool enough for the grandkids IMO :)",
      "created_at": 1753737101,
      "id": "d9ad04432d138911984f480cb6c61e93cf8673c3c1b6c9374de3ce3632ec57f8",
      "kind": 1,
      "pubkey": "15f70ebd30f69b85bba87c3ec45645300dc2835a6dac235fdf8143cab5e9282c",
      "sig": "dbad3dcac91b180a8f307e671b4a8f6cb7673c0dde768d54bbc02e073fed8249c154d349d968d2bab1b7ab5262192ad109cb4c2922c2636732b1d1d63e40e28a",
      "tags": [
          [
              "p",
              "15f70ebd30f69b85bba87c3ec45645300dc2835a6dac235fdf8143cab5e9282c",
              "",
              "mention"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d",
              "",
              "mention"
          ],
          [
              "p",
              "2248fe0518a40ef52013abd98602bfb7110d5f544d43f56fe5522e6273582fdb",
              "",
              "mention"
          ],
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "",
              "root"
          ],
          [
              "e",
              "bd47e8a8fa3f9fdbfa03599426bff7013d7d42fe881ecab4b5536bad161bd297",
              "",
              "reply"
          ]
      ]
  },
  {
      "content": "Is gold holding its value if it purchases the same amount of bread as it did in ancient times but the real cost of production of bread today is much cheaper due to technological advances?",
      "created_at": 1753741987,
      "id": "514293d59b65625fc28d0dd4c9ca48951e7c127a9b4ea2a29e41163287a8c49b",
      "kind": 1,
      "pubkey": "d2848e87361f66bc7340b1453aaf6ccbc5c5b9cecbd49350cee077e04886e33c",
      "sig": "6ac33990877cee0f7e4d158b863bccb1223293d970522a1ff24a3f951d15d748f3c457ce2e311bdd01686f68cdc5c59e1a40a8d8e5456e83a96e0cee97221d4c",
      "tags": [
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "wss://relay.primal.net",
              "root"
          ],
          [
              "e",
              "0c7ee382c48135b081434911ef43a4415ac8143e4c22b6920e12d8a750290dd2",
              "wss://relay.primal.net",
              "reply"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d",
              "",
              "mention"
          ]
      ]
  },
  {
      "content": "This is a great presentation from 2018.  Even the most hardened bitcioners will learn something.\n\nhttps://m.youtube.com/watch?v=fjhLp8AHAYc \n\n",
      "created_at": 1753745692,
      "id": "171b0b34d1b0bdf41667baa13fe1935562a61cdbf7f625c7f99206ada1dd1b14",
      "kind": 1,
      "pubkey": "e1ca15f1149ef0cec45d565222c2111b85327ede53357a5c4e7c3e17105aa0fa",
      "sig": "cf62c6979b8e1c0d70fc130e86d6486ec42837aef41a67935ea138004d45f54222c2c5ef7af3d4df641225774033bd90c85373f3dd0472bee3440b44bd510b3a",
      "tags": [
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d",
              "wss://relay.primal.net"
          ],
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "wss://relay.primal.net",
              "root",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ]
      ]
  },
  {
      "content": "You do you. ",
      "created_at": 1753747649,
      "id": "9f9b7afebc20be85809d60c72e601cd4a4499af4cab5b9381a71b048018f2b8d",
      "kind": 1,
      "pubkey": "2248fe0518a40ef52013abd98602bfb7110d5f544d43f56fe5522e6273582fdb",
      "sig": "ab5c2a9e7ffce4a06b30bb85db9a845c5b28598d0b16bf17d6e2eafa40476590f20f14fced0b38c2115ce1c8815fa79e1a7841ed209f6b1a06b0841391c44957",
      "tags": [
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "",
              "root"
          ],
          [
              "e",
              "d9ad04432d138911984f480cb6c61e93cf8673c3c1b6c9374de3ce3632ec57f8",
              "wss://nos.lol/%20wss://nostr.land/%20%20avatar%20wss://nostr.wine/%20%20avatar%20wss://purplerelay.com/%20wss://relay.damus.io/%20wss://relay.snort.social/",
              "reply"
          ],
          [
              "p",
              "2248fe0518a40ef52013abd98602bfb7110d5f544d43f56fe5522e6273582fdb",
              "",
              "mention"
          ],
          [
              "p",
              "15f70ebd30f69b85bba87c3ec45645300dc2835a6dac235fdf8143cab5e9282c",
              "",
              "mention"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d",
              "",
              "mention"
          ]
      ]
  },
  {
      "content": "I agree on all 3 fronts, Jeff!  Bitcoin is such a protection from fiat.  I feel incredibly thankful that I get to store my labor hours in something that holds up.",
      "created_at": 1753752475,
      "id": "e80622a54270e701f2de3c4d7cd67d81bc6d05da4d40987b4364b68655a672a6",
      "kind": 1,
      "pubkey": "df9150e8cdb9649aa2f223207b429fa16b22f7bcba2381b4053ac3634b224b13",
      "sig": "b5136082b62966731bcedac35f0951dc7db10e254ec7fcf84e712819a75a85b1a5c6cc664bfa710ee7d02c12b52237b5539ea548c729f1b0db3700d40544491e",
      "tags": [
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "wss://relay.primal.net",
              "root"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d",
              "",
              "mention"
          ]
      ]
  },
  {
      "content": "It seems that Bitcoin will appreciate in value in the future. I am now starting to learn more about Bitcoin, hoping that it will help me purchase this Used Westport yacht that I have admired for a long time. 👉https://www.yachttrading.com/used-yachts-for-sale/brand-westport/ I have a feeling that I will soon own this Used Westport yacht.",
      "created_at": 1753754839,
      "id": "c28b39fe247281a19dec336915b2ec68a11b3a5f5ee845283905414525763e7a",
      "kind": 1,
      "pubkey": "6b1abe967aafc2f5eefc55dc1eebced7307752e8b53acd6e7f16d152e16a0542",
      "sig": "df06f72f11fff6b6a8a273e6f83cf6ced674d3fb2191ad8a8166d0a34c4ca64bc792ce63b7a390c7c35c4e4ed391dd50a5110a031b9f9ff13e90e01c7038a218",
      "tags": [
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "wss://relay.primal.net",
              "root"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ],
          [
              "r",
              "wss://relay.primal.net/"
          ]
      ]
  },
  {
      "content": "With gold prices soaring and currencies depreciating, I'm wondering if my newly purchased super yacht is worth 1 tonne of gold now ? I originally bought it as an investment asset, But looking at it this way, gold seems to be the wiser choice after all.🤣 https://www.yachttrading.com/new-yachts-for-sale/yacht-type-superyacht/",
      "created_at": 1753756069,
      "id": "a0a2b4117ae6e6a252263c877246bd053eb28a3c77530c596df803cca14fd832",
      "kind": 1,
      "pubkey": "4eeaa9d33614a1775f8ab2251049acb5af34365d8d4b8485ef081a28f0787bfa",
      "sig": "8e2137732c549f6468d2e4f9c5ee585cdf466da2f3d2fa2e8533ca4b4a956075a3d459b593ebd4ba0a226088d2856b6f05876c708781ca4d2054debe6d7ad04b",
      "tags": [
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "wss://relay.primal.net",
              "root"
          ],
          [
              "e",
              "0c7ee382c48135b081434911ef43a4415ac8143e4c22b6920e12d8a750290dd2",
              "wss://relay.primal.net",
              "reply"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ],
          [
              "r",
              "wss://relay.primal.net/"
          ]
      ]
  },
  {
      "content": "Well said",
      "created_at": 1753758470,
      "id": "5d276c03be626bb49dbbe6075fc153d0fdaa97cc5d65929a9c1fe7691fff13e0",
      "kind": 1,
      "pubkey": "e6f713f35a15983f21cf9165c1187131be7316dc9a6985fc35e5f703be07f7cb",
      "sig": "802081262abe79806b13147365df4b23181c55406d39b3c14cf0f8ae2916dc6ffe3f4a22dde1b2c0b6992a550bca259ffc7f8dceca44168bebd8d20a83f1f0fd",
      "tags": [
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "wss://relay.primal.net",
              "root"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d",
              "",
              "mention"
          ]
      ]
  },
  {
      "content": "When boomers write in CAPITALS it makes them feel MORE AUTHORITATIVE",
      "created_at": 1753765316,
      "id": "f621c98defee8840c814cdb735073b3268382c27840b7ddfb6eaaff60f9048a5",
      "kind": 1,
      "pubkey": "72039a17ad045c0e2ffa0b2fdd9c08467f8190e04f4f4672ffb516a61a815f86",
      "sig": "b781163cd45d3c6c971ba15ff8f8aa89edcee42ba88bf4e7b5db744d613f68bd593b3f4260ad021ff97886d6cc522331df98f8314dbc7f80f127303c2900d2be",
      "tags": [
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "wss://relay.primal.net",
              "root"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ]
      ]
  },
  {
      "content": "Few understand ",
      "created_at": 1753773293,
      "id": "d87e95c94064922eff788ee5bdc522f7d60f5cd662cd7ef638e7345dae71e203",
      "kind": 1,
      "pubkey": "ff2f4cd786e42b4323749c91517ec7baf22dfd035b7a101bea83b6e2bcbacd15",
      "sig": "7b121daf4621144876f59aef1868d61d796189056b0e0b88e084c5f1820ff902b04bcae16d95461e8638becad5fcdc4bc1108eb696a671fcb45170e5bf128501",
      "tags": [
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "wss://relay.primal.net",
              "root"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d",
              "",
              "mention"
          ]
      ]
  },
  {
      "content": "Ok. \nLet's just use our own brains to think about this instead of relying on chatgpt to think for us. \n1 incorrect information \n2 incorrect information \n3 incorrect information \n4oh wow that statement is actually true. \n\nSo chatgpt got 1 out of the 4 statements it made correct. \nWhile the other 3 statements are nonsense. \n\n \n\n",
      "created_at": 1753773297,
      "id": "419e431032cb5bb59ce7457097c71285a1bfec8dc8586c2cead165b06de4de17",
      "kind": 1,
      "pubkey": "165b9d37a28903103af9ad24036bdc54270882c01add515791fc9666167cfac1",
      "sig": "9975d50754b4b8d9c6c881f65eeb1b8a17286c348f93e27dd8ab453a835255959a7996271cb807b217b6365b2f7cd2f8c59c2a6d2824a91779b677eec2a89c26",
      "tags": [
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d",
              "wss://relay.primal.net"
          ],
          [
              "e",
              "0c7ee382c48135b081434911ef43a4415ac8143e4c22b6920e12d8a750290dd2",
              "wss://relay.primal.net",
              "reply",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ],
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "wss://relay.primal.net",
              "root",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ]
      ]
  },
  {
      "content": "One ounce of gold = $5k Australian\nOne sheep = $500 Australian\n\nI can't imagine being stupid enough to pay $5k on a suit. \n\nAnd I can assure you, $5k worth of bread is way more than a few months. \nLike just stop relying on chatgpt to think for you. \nAsk yourself, come on its a very math puzzle. \nAsk yourself. \n\"If bread costs $2 a loaf and gold is worth $5k an ounce how many loafs of bread can I get for an ounce of gold\" (the answer is 2500 loafs of bread) \n\nlet me assure you that 2500 weeks, or 1250 weeks if you personally eat two loafs of bread every week, or even 625 weeks of bread if you eat 4 each week or whatever number. \nLet me assure you it's more than a few months worth of bread. \nThere's only 52 weeks in a year right. \nNobody is eating the much bread nobody is paying that much for sheep, nobody who isn't retarded is spending that much money on a suit. Etc. \n \n\n",
      "created_at": 1753773954,
      "id": "bfd6421b62b4285071487c414fed77f5f7a8c65e7e10624b33a75457aadf6500",
      "kind": 1,
      "pubkey": "165b9d37a28903103af9ad24036bdc54270882c01add515791fc9666167cfac1",
      "sig": "8f60c33b74db07659fae134774f69fc4182d3bc78f94e97a43e700a19fbd90e30a10d76bda3f16eb49ef12a06ac824275dbc5699446a40a84576dfd65510e99f",
      "tags": [
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d",
              "wss://relay.primal.net"
          ],
          [
              "e",
              "0c7ee382c48135b081434911ef43a4415ac8143e4c22b6920e12d8a750290dd2",
              "wss://relay.primal.net",
              "reply",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ],
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "wss://relay.primal.net",
              "root",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ]
      ]
  },
  {
      "content": "Bullish on #BTC!",
      "created_at": 1753776981,
      "id": "a1c3aa3ba695c330fa9d48c73208975dc2a27e3b04d27c5cf91c6bc99ebe8b3f",
      "kind": 1,
      "pubkey": "4d5bb8836f3087845a3ed8dfb4d7856563210c71f8ed2d9d5631482917df369c",
      "sig": "80b16d5ca4ce29d3cc88dd2c2b89984669652b3e6065fd7f3914c68d0414addd2e1fad99566db955639fb9439624dbb1e2fd24c882281198ddf188f800e35d81",
      "tags": [
          [
              "t",
              "BTC"
          ],
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "wss://relay.primal.net",
              "root"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ],
          [
              "r",
              "wss://relay.primal.net/"
          ]
      ]
  },
  {
      "content": "OK DoomScroller",
      "created_at": 1753784117,
      "id": "464b9cce49987320eae263b1e06b31053d33d2b3ef4ad5642ad36d002fce0962",
      "kind": 1,
      "pubkey": "6e0a3f28dc91e2fff087d11e19f1674a91efa5ecdb3d1cea6fd28ccd2f8b4490",
      "sig": "e94d0256b6c31bce16d3e7671ac3cd5fa2484b65117844a9e2ccddacff324e7de9014c77d38b630ff2b470d2a2c8ad9c077c86556f087a5191b172e25ad25c02",
      "tags": [
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "wss://relay.wellorder.net",
              "root"
          ],
          [
              "e",
              "f621c98defee8840c814cdb735073b3268382c27840b7ddfb6eaaff60f9048a5",
              "wss://relay.wellorder.net",
              "reply"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ],
          [
              "p",
              "72039a17ad045c0e2ffa0b2fdd9c08467f8190e04f4f4672ffb516a61a815f86"
          ],
          [
              "r",
              "wss://eden.nostr.land/",
              "read"
          ],
          [
              "r",
              "wss://nostr.wine/",
              "read"
          ],
          [
              "r",
              "wss://relay.nostr.band/"
          ],
          [
              "r",
              "wss://relay.snort.social/"
          ],
          [
              "r",
              "wss://relay.damus.io/"
          ]
      ]
  },
  {
      "content": "We’re that late in the cycle?",
      "created_at": 1753784574,
      "id": "1d4664b3b310922b59dce789aac21fdcd134a7cb802e54f7e992fea912cc248d",
      "kind": 1,
      "pubkey": "72039a17ad045c0e2ffa0b2fdd9c08467f8190e04f4f4672ffb516a61a815f86",
      "sig": "3a2928486bdb505937fe0c53a3cdfbf2823640e47f2e2e8d5aedbf83452efe888851bc9cef4507cec85095c25c3484edd926d8cdb5254b252aa354c31201eca1",
      "tags": [
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "wss://relay.wellorder.net",
              "root"
          ],
          [
              "e",
              "464b9cce49987320eae263b1e06b31053d33d2b3ef4ad5642ad36d002fce0962",
              "",
              "reply"
          ],
          [
              "p",
              "6e0a3f28dc91e2fff087d11e19f1674a91efa5ecdb3d1cea6fd28ccd2f8b4490"
          ]
      ]
  },
  {
      "content": "Oh, they need to know you dirty pajeets are parasites too",
      "created_at": 1753846932,
      "id": "a4bb122473fc292d43e78e5ca51d75e234ca29bd715f46d97fbf2719b356b35e",
      "kind": 1,
      "pubkey": "d9dba0e072bdb353dfb0020de159126af47e69e133ea91bbd48e8bede37320e2",
      "sig": "bbdb1363ea6f2494ff7b6aed5d662b895bacef883b95132166b7348f6141ebd5efc962772f9247808c7e523560efca1e8663c09fc0c5ca7873c016d75f946a17",
      "tags": [
          [
              "e",
              "a085e1518dc3d2def062a636710eb96bccc559bf8fdce3590a86e7afe585c5d3",
              "wss://relay.primal.net",
              "root"
          ],
          [
              "e",
              "3257dc9a7be06086d9b8f05193c3cf859dced2e264ec670a4493c9fa4e55d94c",
              "",
              "reply"
          ],
          [
              "p",
              "b7996c183e036df27802945b80bbdc8b0bf5971b6621a86bf3569c332117f07d"
          ],
          [
              "p",
              "42666b2f164c97609faa1c8deb464396aceca253cbef480a51e27fc6995a2444"
          ]
      ]
  }
];

// Simulate the fixed createNip10Thread logic
function createNip10ThreadFixed(events, rootEventId) {
  if (!events || events.length === 0) {
    return [];
  }

  // Create a map of event ID to event for quick lookup
  const eventMap = new Map();
  events.forEach((event) => {
    eventMap.set(event.id, event);
  });

  // Create a map of parent ID to children
  const childrenMap = new Map();

  events.forEach((event) => {
    // Find the e tags (event references)
    const eTags = event.tags.filter((tag) => tag[0] === "e");

    if (eTags.length > 0) {
      let parentId = null;

      // Parse NIP-10 markers
      for (const tag of eTags) {
        const [, eventId, , marker] = tag;
        
        if (marker === "reply") {
          // This is the direct parent being replied to
          parentId = eventId;
          break;
        } else if (marker === "root" && !parentId) {
          // If no "reply" marker found, use "root" as parent (for top-level replies)
          parentId = eventId;
        }
      }

      if (parentId && parentId !== rootEventId) {
        if (!childrenMap.has(parentId)) {
          childrenMap.set(parentId, []);
        }

        childrenMap.get(parentId).push(event);
      }
    }
  });

  // Recursive function to build the tree
  function buildNode(eventId, depth) {
    const event = eventMap.get(eventId);
    if (!event) {
      return null;
    }

    const children = childrenMap.get(eventId) || [];
    const childNodes = children
      .map((child) => buildNode(child.id, depth + 1))
      .filter((node) => node !== null);

    return {
      event,
      children: childNodes,
      depth,
    };
  }

  // Find root-level replies (those that directly reference the root event)
  const rootLevelReplies = events.filter((event) => {
    const eTags = event.tags.filter((tag) => tag[0] === "e");

    // Check for NIP-10 root markers - only events with ONLY "root" marker are root-level
    let hasRootMarker = false;
    let hasReplyMarker = false;
    
    for (const tag of eTags) {
      const [, eventId, , marker] = tag;
      
      if (marker === "root" && eventId === rootEventId) {
        hasRootMarker = true;
      } else if (marker === "reply") {
        hasReplyMarker = true;
      }
    }
    
    // Only root-level if it has "root" marker but no "reply" marker
    return hasRootMarker && !hasReplyMarker;
  });

  // Build the thread structure
  const thread = rootLevelReplies
    .map((event) => buildNode(event.id, 0))
    .filter((node) => node !== null);

  return thread;
}

// Count all events in the thread recursively
function countAllEvents(thread) {
  let count = 0;
  
  function countNode(node) {
    count++;
    node.children.forEach(countNode);
  }
  
  thread.forEach(countNode);
  return count;
}

// Test the function
const thread = createNip10ThreadFixed(testEvents, rootEventId);
const totalEvents = countAllEvents(thread);

// Find missing events
const threadEventIds = new Set();
function collectEventIds(thread) {
  thread.forEach(node => {
    threadEventIds.add(node.event.id);
    node.children.forEach(child => {
      threadEventIds.add(child.event.id);
    });
  });
}
collectEventIds(thread);

const missingEvents = testEvents.filter(event => !threadEventIds.has(event.id));

console.log('Test NIP-10 marker parsing:');
console.log('Input events:', testEvents.length);
console.log('Root-level replies found:', thread.length);
console.log('Total events in thread:', totalEvents);
console.log('Missing events:', testEvents.length - totalEvents);
console.log('Missing event IDs:', missingEvents.map(e => e.id));
console.log('Missing event tags:', missingEvents.map(e => e.tags.filter(t => t[0] === 'e')));

// Check specific events
const problematicEvents = [
  'd57f16e0979a0e8640da3286190abb9b38a924fd052d2737e6ca0fd6f866193e',
  '77037d491a37c8404812d85fc2e7d4f56d510b70006aaceedc08fcaff8ce9a75'
];

console.log('\nChecking problematic events:');
problematicEvents.forEach(eventId => {
  const event = testEvents.find(e => e.id === eventId);
  if (event) {
    const eTags = event.tags.filter(tag => tag[0] === 'e');
    const hasReplyMarker = eTags.some(tag => tag[3] === 'reply');
    console.log(`${eventId.substr(0, 8)}... - hasReplyMarker: ${hasReplyMarker}, should be root-level: ${!hasReplyMarker}`);
  }
});

console.log('Thread structure:');
thread.forEach((node, i) => {
  console.log(`- ${node.event.id} (depth: ${node.depth}, children: ${node.children.length})`);
  node.children.forEach(child => {
    console.log(`  - ${child.event.id} (depth: ${child.depth}, children: ${child.children.length})`);
  });
}); 