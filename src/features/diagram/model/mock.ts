export const MOCK_RESULTS = {
	music: [
		{ title: "ppqq", artist: "Pishu" },
		{ title: "Antichrist Television Blues", artist: "Arcade Fire" },
		{ title: "Motion Picture Soundtrack", artist: "Radiohead" },
	],
	game: [
		{ title: "Elden Ring", releaseYear: 2022 },
		{ title: "Hollow Knight", releaseYear: 2017 },
		{ title: "Disco Elysium", releaseYear: 2019 },
	],
	movie: [
		{ title: "Everything Everywhere All at Once", releaseYear: 2022 },
		{ title: "Portrait of a Lady on Fire", releaseYear: 2019 },
		{ title: "Annihilation", releaseYear: 2018 },
	],
	book: [
		{ title: "The Left Hand of Darkness", author: "Ursula K. Le Guin" },
		{ title: "Piranesi", author: "Susanna Clarke" },
		{ title: "Normal People", author: "Sally Rooney" },
	],
} as const;

// Naver Book
// https://openapi.naver.com/v1/search/book.json/

// "title": "에너지의 이름들 (부싯돌에서 그린수소까지 에너지의 모든 것)",
// "link": "https://search.shopping.naver.com/book/catalog/57441842014",
// "image": "https://shopping-phinf.pstatic.net/main_5744184/57441842014.20251104090117.jpg",
// "author": "이상현",
// "discount": "15750",
// "publisher": "이케이북",
// "pubdate": "20251111",
// "isbn": "9791186222782",
// "description": "에너지로 연결된 세상 읽기\n우리가 주변에서 관찰할 수 있는 에너지 중 하나라도 일상
