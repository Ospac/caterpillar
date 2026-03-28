export const MOCK_RESULTS = {
	music: [
		{
			title: "ppqq",
			artist: "Pishu",
			image:
				"https://lastfm.freetls.fastly.net/i/u/500x500/be8eb85d6e4687d24321e4d6fff65718.jpg",
		},
		{
			title: "Antichrist Television Blues",
			artist: "Arcade Fire",
			image:
				"https://lastfm.freetls.fastly.net/i/u/500x500/be8eb85d6e4687d24321e4d6fff65718.jpg",
		},
		{
			title: "Motion Picture Soundtrack",
			artist: "Radiohead",
			image:
				"https://lastfm.freetls.fastly.net/i/u/500x500/be8eb85d6e4687d24321e4d6fff65718.jpg",
		},
	],
	game: [
		{
			title: "Elden Ring",
			releaseYear: 2022,
			image:
				"https://images.igdb.com/igdb/image/upload/t_cover_big/co1sfj.webp",
		},
		{
			title: "Hollow Knight",
			releaseYear: 2017,
			image:
				"https://images.igdb.com/igdb/image/upload/t_cover_big/co1sfj.webp",
		},
		{
			title: "Disco Elysium",
			releaseYear: 2019,
			image:
				"https://images.igdb.com/igdb/image/upload/t_cover_big/co1sfj.webp",
		},
	],
	movie: [
		{
			title: "Everything Everywhere All at Once",
			releaseYear: 2022,
			image:
				"https://media.themoviedb.org/t/p/w300_and_h450_face/aIRrCuaWpsdVil2T2vTfjL7MLWR.jpg",
		},
		{
			title: "Portrait of a Lady on Fire",
			releaseYear: 2019,
			image:
				"https://media.themoviedb.org/t/p/w300_and_h450_face/aIRrCuaWpsdVil2T2vTfjL7MLWR.jpg",
		},
		{
			title: "Annihilation",
			releaseYear: 2018,
			image:
				"https://media.themoviedb.org/t/p/w300_and_h450_face/aIRrCuaWpsdVil2T2vTfjL7MLWR.jpg",
		},
	],
	book: [
		{
			title: "The Left Hand of Darkness",
			author: "Ursula K. Le Guin",
			image:
				"https://shopping-phinf.pstatic.net/main_3246352/32463527641.20240917111252.jpg?type=w300",
		},
		{
			title: "Piranesi",
			author: "Susanna Clarke",
			image:
				"https://shopping-phinf.pstatic.net/main_3246352/32463527641.20240917111252.jpg?type=w300",
		},
		{
			title: "Normal People",
			author: "Sally Rooney",
			image:
				"https://shopping-phinf.pstatic.net/main_3246352/32463527641.20240917111252.jpg?type=w300",
		},
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
