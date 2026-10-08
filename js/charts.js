// 차트 종류 미니 그림 + 핵심 특징 (해설·오답노트·요약에서 차트 이름이 나오면 자동으로 그림 표시)
window.CHARTS = {
 "세로 막대형": {
  "svg": "<svg viewBox=\"0 0 120 80\" aria-hidden=\"true\"><path class=\"ax\" d=\"M14 8V70H112\"/><rect class=\"a\" x=\"20.0\" y=\"40.0\" width=\"14.0\" height=\"30.0\" rx=\"1\"/><rect class=\"a\" x=\"43.0\" y=\"22.0\" width=\"14.0\" height=\"48.0\" rx=\"1\"/><rect class=\"a\" x=\"66.0\" y=\"48.0\" width=\"14.0\" height=\"22.0\" rx=\"1\"/><rect class=\"a\" x=\"89.0\" y=\"14.0\" width=\"14.0\" height=\"56.0\" rx=\"1\"/></svg>",
  "tip": "항목끼리 값 크기 비교. 가장 기본 차트"
 },
 "가로 막대형": {
  "svg": "<svg viewBox=\"0 0 120 80\" aria-hidden=\"true\"><path class=\"ax\" d=\"M14 8V70H112\"/><rect class=\"a\" x=\"14.0\" y=\"12.0\" width=\"60.0\" height=\"10.0\" rx=\"1\"/><rect class=\"a\" x=\"14.0\" y=\"27.0\" width=\"88.0\" height=\"10.0\" rx=\"1\"/><rect class=\"a\" x=\"14.0\" y=\"42.0\" width=\"40.0\" height=\"10.0\" rx=\"1\"/><rect class=\"a\" x=\"14.0\" y=\"57.0\" width=\"74.0\" height=\"10.0\" rx=\"1\"/></svg>",
  "tip": "항목 이름이 길거나 값 비교를 강조할 때"
 },
 "꺾은선형": {
  "svg": "<svg viewBox=\"0 0 120 80\" aria-hidden=\"true\"><path class=\"ax\" d=\"M14 8V70H112\"/><polyline class=\"ln\" points=\"22,56 42,40 62,46 82,24 102,30\"/><circle class=\"a\" cx=\"22\" cy=\"56\" r=\"2.6\"/><circle class=\"a\" cx=\"42\" cy=\"40\" r=\"2.6\"/><circle class=\"a\" cx=\"62\" cy=\"46\" r=\"2.6\"/><circle class=\"a\" cx=\"82\" cy=\"24\" r=\"2.6\"/><circle class=\"a\" cx=\"102\" cy=\"30\" r=\"2.6\"/></svg>",
  "tip": "일정한 간격(시간)에 따른 추세"
 },
 "원형": {
  "svg": "<svg viewBox=\"0 0 120 80\" aria-hidden=\"true\"><path class=\"a\" d=\"M60 40L60.0 10.0A30 30 0 0 1 69.3 68.5Z\"/><path class=\"b\" d=\"M60 40L69.3 68.5A30 30 0 0 1 31.5 49.3Z\"/><path class=\"c\" d=\"M60 40L31.5 49.3A30 30 0 0 1 39.5 18.1Z\"/><path class=\"d\" d=\"M60 40L39.5 18.1A30 30 0 0 1 60.0 10.0Z\"/></svg>",
  "tip": "전체에 대한 비율. 데이터 계열 1개만, 축 없음"
 },
 "도넛형": {
  "svg": "<svg viewBox=\"0 0 120 80\" aria-hidden=\"true\"><circle class=\"ka\" cx=\"60\" cy=\"40\" r=\"24\" stroke-width=\"12\" stroke-dasharray=\"59.1 91.7\" stroke-dashoffset=\"0.0\" transform=\"rotate(-90 60 40)\"/><circle class=\"kb\" cx=\"60\" cy=\"40\" r=\"24\" stroke-width=\"12\" stroke-dasharray=\"44.0 106.8\" stroke-dashoffset=\"-60.3\" transform=\"rotate(-90 60 40)\"/><circle class=\"kc\" cx=\"60\" cy=\"40\" r=\"24\" stroke-width=\"12\" stroke-dasharray=\"29.0 121.8\" stroke-dashoffset=\"-105.6\" transform=\"rotate(-90 60 40)\"/><circle class=\"kd\" cx=\"60\" cy=\"40\" r=\"24\" stroke-width=\"12\" stroke-dasharray=\"13.9 136.9\" stroke-dashoffset=\"-135.7\" transform=\"rotate(-90 60 40)\"/></svg>",
  "tip": "전체에 대한 비율. 여러 계열 가능, 축 없음"
 },
 "분산형": {
  "svg": "<svg viewBox=\"0 0 120 80\" aria-hidden=\"true\"><path class=\"ax\" d=\"M14 8V70H112\"/><circle class=\"a\" cx=\"22\" cy=\"60\" r=\"2.8\"/><circle class=\"a\" cx=\"28\" cy=\"52\" r=\"2.8\"/><circle class=\"a\" cx=\"37\" cy=\"55\" r=\"2.8\"/><circle class=\"a\" cx=\"45\" cy=\"44\" r=\"2.8\"/><circle class=\"a\" cx=\"52\" cy=\"46\" r=\"2.8\"/><circle class=\"a\" cx=\"60\" cy=\"38\" r=\"2.8\"/><circle class=\"a\" cx=\"68\" cy=\"34\" r=\"2.8\"/><circle class=\"a\" cx=\"75\" cy=\"36\" r=\"2.8\"/><circle class=\"a\" cx=\"84\" cy=\"26\" r=\"2.8\"/><circle class=\"a\" cx=\"92\" cy=\"22\" r=\"2.8\"/><circle class=\"a\" cx=\"100\" cy=\"18\" r=\"2.8\"/><circle class=\"a\" cx=\"106\" cy=\"14\" r=\"2.8\"/></svg>",
  "tip": "두 숫자 값의 관계(X·Y). 가로축 간격이 일정하지 않을 때, 과학·공학 데이터"
 },
 "방사형": {
  "svg": "<svg viewBox=\"0 0 120 80\" aria-hidden=\"true\"><polygon class=\"gr\" points=\"60.0,10.0 90.4,32.1 78.8,67.9 41.2,67.9 29.6,32.1\"/><polygon class=\"gr\" points=\"60.0,26.0 75.2,37.1 69.4,54.9 50.6,54.9 44.8,37.1\"/><line class=\"gr\" x1=\"60\" y1=\"42\" x2=\"60.0\" y2=\"10.0\"/><line class=\"gr\" x1=\"60\" y1=\"42\" x2=\"90.4\" y2=\"32.1\"/><line class=\"gr\" x1=\"60\" y1=\"42\" x2=\"78.8\" y2=\"67.9\"/><line class=\"gr\" x1=\"60\" y1=\"42\" x2=\"41.2\" y2=\"67.9\"/><line class=\"gr\" x1=\"60\" y1=\"42\" x2=\"29.6\" y2=\"32.1\"/><polygon class=\"ra\" points=\"60.0,13.2 78.3,36.1 75.0,62.7 50.6,54.9 38.7,35.1\"/><polygon class=\"rb\" points=\"60.0,26.0 87.4,33.1 67.5,52.4 45.0,62.7 46.3,37.6\"/></svg>",
  "tip": "여러 데이터 계열의 집합적인 값. 가운데서 항목별 축이 뻗음"
 },
 "영역형": {
  "svg": "<svg viewBox=\"0 0 120 80\" aria-hidden=\"true\"><path class=\"ax\" d=\"M14 8V70H112\"/><polygon class=\"b\" points=\"14,70 14,48 38,40 62,44 86,30 112,34 112,70\"/><polygon class=\"a\" points=\"14,70 14,60 38,56 62,58 86,50 112,52 112,70\"/></svg>",
  "tip": "시간에 따른 변동의 크기 강조, 합계의 추세"
 },
 "표면형": {
  "svg": "<svg viewBox=\"0 0 120 80\" aria-hidden=\"true\"><polygon class=\"d\" points=\"14.0,20.0 26.0,24.3 38.0,26.0 50.0,24.1 62.0,19.6 74.0,15.5 86.0,14.0 98.0,16.2 110.0,20.7 110.0,32.7 98.0,28.2 86.0,26.0 74.0,27.5 62.0,31.6 50.0,36.1 38.0,38.0 26.0,36.3 14.0,32.0\"/><polygon class=\"c\" points=\"14.0,37.0 26.0,37.8 38.0,35.1 50.0,30.5 62.0,26.8 74.0,26.2 86.0,29.2 98.0,33.9 110.0,37.4 110.0,49.4 98.0,45.9 86.0,41.2 74.0,38.2 62.0,38.8 50.0,42.5 38.0,47.1 26.0,49.8 14.0,49.0\"/><polygon class=\"b\" points=\"14.0,49.5 26.0,46.0 38.0,41.3 50.0,38.3 62.0,38.7 74.0,42.3 86.0,47.0 98.0,49.8 110.0,49.1 110.0,61.1 98.0,61.8 86.0,59.0 74.0,54.3 62.0,50.7 50.0,50.3 38.0,53.3 26.0,58.0 14.0,61.5\"/><polygon class=\"a\" points=\"14.0,56.8 26.0,52.3 38.0,50.0 50.0,51.4 62.0,55.5 74.0,59.9 86.0,62.0 98.0,60.4 110.0,56.1 110.0,68.1 98.0,72.4 86.0,74.0 74.0,71.9 62.0,67.5 50.0,63.4 38.0,62.0 26.0,64.3 14.0,68.8\"/><line class=\"mesh\" x1=\"14\" y1=\"14\" x2=\"14\" y2=\"74\"/><line class=\"mesh\" x1=\"26\" y1=\"14\" x2=\"26\" y2=\"74\"/><line class=\"mesh\" x1=\"38\" y1=\"14\" x2=\"38\" y2=\"74\"/><line class=\"mesh\" x1=\"50\" y1=\"14\" x2=\"50\" y2=\"74\"/><line class=\"mesh\" x1=\"62\" y1=\"14\" x2=\"62\" y2=\"74\"/><line class=\"mesh\" x1=\"74\" y1=\"14\" x2=\"74\" y2=\"74\"/><line class=\"mesh\" x1=\"86\" y1=\"14\" x2=\"86\" y2=\"74\"/><line class=\"mesh\" x1=\"98\" y1=\"14\" x2=\"98\" y2=\"74\"/><line class=\"mesh\" x1=\"110\" y1=\"14\" x2=\"110\" y2=\"74\"/></svg>",
  "tip": "두 데이터 집합에서 최적의 조합 찾기"
 },
 "주식형": {
  "svg": "<svg viewBox=\"0 0 120 80\" aria-hidden=\"true\"><path class=\"ax\" d=\"M14 8V70H112\"/><line class=\"ln2\" x1=\"26\" y1=\"16\" x2=\"26\" y2=\"44\"/><rect class=\"e\" x=\"21.0\" y=\"22.0\" width=\"10.0\" height=\"16.0\" rx=\"1\"/><line class=\"ln2\" x1=\"48\" y1=\"22\" x2=\"48\" y2=\"50\"/><rect class=\"a\" x=\"43.0\" y=\"30.0\" width=\"10.0\" height=\"12.0\" rx=\"1\"/><line class=\"ln2\" x1=\"70\" y1=\"28\" x2=\"70\" y2=\"58\"/><rect class=\"e\" x=\"65.0\" y=\"34.0\" width=\"10.0\" height=\"16.0\" rx=\"1\"/><line class=\"ln2\" x1=\"92\" y1=\"12\" x2=\"92\" y2=\"40\"/><rect class=\"a\" x=\"87.0\" y=\"18.0\" width=\"10.0\" height=\"18.0\" rx=\"1\"/></svg>",
  "tip": "주가의 고가·저가·종가 변동"
 },
 "거품형": {
  "svg": "<svg viewBox=\"0 0 120 80\" aria-hidden=\"true\"><path class=\"ax\" d=\"M14 8V70H112\"/><circle class=\"ao\" cx=\"32\" cy=\"52\" r=\"8\"/><circle class=\"bo\" cx=\"56\" cy=\"36\" r=\"13\"/><circle class=\"co\" cx=\"84\" cy=\"50\" r=\"6\"/><circle class=\"ao\" cx=\"96\" cy=\"22\" r=\"10\"/></svg>",
  "tip": "값 3개(X, Y, 거품 크기)를 한 번에"
 },
 "히스토그램": {
  "svg": "<svg viewBox=\"0 0 120 80\" aria-hidden=\"true\"><path class=\"ax\" d=\"M14 8V70H112\"/><rect class=\"a\" x=\"16.0\" y=\"58.0\" width=\"16.0\" height=\"12.0\" rx=\"0\" stroke-width=\"1\"/><rect class=\"a\" x=\"32.0\" y=\"40.0\" width=\"16.0\" height=\"30.0\" rx=\"0\" stroke-width=\"1\"/><rect class=\"a\" x=\"48.0\" y=\"20.0\" width=\"16.0\" height=\"50.0\" rx=\"0\" stroke-width=\"1\"/><rect class=\"a\" x=\"64.0\" y=\"28.0\" width=\"16.0\" height=\"42.0\" rx=\"0\" stroke-width=\"1\"/><rect class=\"a\" x=\"80.0\" y=\"46.0\" width=\"16.0\" height=\"24.0\" rx=\"0\" stroke-width=\"1\"/><rect class=\"a\" x=\"96.0\" y=\"60.0\" width=\"16.0\" height=\"10.0\" rx=\"0\" stroke-width=\"1\"/></svg>",
  "tip": "분포 안의 빈도를 계급 구간 막대로"
 },
 "트리맵": {
  "svg": "<svg viewBox=\"0 0 120 80\" aria-hidden=\"true\"><rect class=\"a\" x=\"10.0\" y=\"8.0\" width=\"58.0\" height=\"64.0\" rx=\"1\"/><rect class=\"b\" x=\"70.0\" y=\"8.0\" width=\"40.0\" height=\"38.0\" rx=\"1\"/><rect class=\"c\" x=\"70.0\" y=\"48.0\" width=\"22.0\" height=\"24.0\" rx=\"1\"/><rect class=\"d\" x=\"94.0\" y=\"48.0\" width=\"16.0\" height=\"24.0\" rx=\"1\"/></svg>",
  "tip": "계층 간 상대적 크기를 사각형으로"
 },
 "선버스트": {
  "svg": "<svg viewBox=\"0 0 120 80\" aria-hidden=\"true\"><circle class=\"ka\" cx=\"60\" cy=\"40\" r=\"12\" stroke-width=\"10\" stroke-dasharray=\"36.5 38.9\" stroke-dashoffset=\"0.0\" transform=\"rotate(-90 60 40)\"/><circle class=\"kb\" cx=\"60\" cy=\"40\" r=\"12\" stroke-width=\"10\" stroke-dasharray=\"21.4 54.0\" stroke-dashoffset=\"-37.7\" transform=\"rotate(-90 60 40)\"/><circle class=\"kc\" cx=\"60\" cy=\"40\" r=\"12\" stroke-width=\"10\" stroke-dasharray=\"13.9 61.5\" stroke-dashoffset=\"-60.3\" transform=\"rotate(-90 60 40)\"/><circle class=\"ka\" cx=\"60\" cy=\"40\" r=\"26\" stroke-width=\"12\" stroke-dasharray=\"31.5 131.9\" stroke-dashoffset=\"0.0\" transform=\"rotate(-90 60 40)\"/><circle class=\"ka\" cx=\"60\" cy=\"40\" r=\"26\" stroke-width=\"12\" stroke-dasharray=\"47.8 115.6\" stroke-dashoffset=\"-32.7\" transform=\"rotate(-90 60 40)\"/><circle class=\"kb\" cx=\"60\" cy=\"40\" r=\"26\" stroke-width=\"12\" stroke-dasharray=\"23.3 140.1\" stroke-dashoffset=\"-81.7\" transform=\"rotate(-90 60 40)\"/><circle class=\"kb\" cx=\"60\" cy=\"40\" r=\"26\" stroke-width=\"12\" stroke-dasharray=\"23.3 140.1\" stroke-dashoffset=\"-106.2\" transform=\"rotate(-90 60 40)\"/><circle class=\"kc\" cx=\"60\" cy=\"40\" r=\"26\" stroke-width=\"12\" stroke-dasharray=\"18.4 145.0\" stroke-dashoffset=\"-130.7\" transform=\"rotate(-90 60 40)\"/><circle class=\"kc\" cx=\"60\" cy=\"40\" r=\"26\" stroke-width=\"12\" stroke-dasharray=\"11.9 151.5\" stroke-dashoffset=\"-150.3\" transform=\"rotate(-90 60 40)\"/></svg>",
  "tip": "계층 간 관계를 고리(원)로"
 },
 "상자 수염": {
  "svg": "<svg viewBox=\"0 0 120 80\" aria-hidden=\"true\"><path class=\"ax\" d=\"M14 8V70H112\"/><line class=\"ln2\" x1=\"32\" y1=\"20\" x2=\"32\" y2=\"56\"/><line class=\"ln2\" x1=\"27\" y1=\"20\" x2=\"37\" y2=\"20\"/><line class=\"ln2\" x1=\"27\" y1=\"56\" x2=\"37\" y2=\"56\"/><rect class=\"a\" x=\"24.0\" y=\"34.0\" width=\"16.0\" height=\"14.0\" rx=\"1\"/><line class=\"md\" x1=\"24\" y1=\"42\" x2=\"40\" y2=\"42\"/><line class=\"ln2\" x1=\"62\" y1=\"28\" x2=\"62\" y2=\"62\"/><line class=\"ln2\" x1=\"57\" y1=\"28\" x2=\"67\" y2=\"28\"/><line class=\"ln2\" x1=\"57\" y1=\"62\" x2=\"67\" y2=\"62\"/><rect class=\"a\" x=\"54.0\" y=\"40.0\" width=\"16.0\" height=\"12.0\" rx=\"1\"/><line class=\"md\" x1=\"54\" y1=\"46\" x2=\"70\" y2=\"46\"/><line class=\"ln2\" x1=\"92\" y1=\"14\" x2=\"92\" y2=\"50\"/><line class=\"ln2\" x1=\"87\" y1=\"14\" x2=\"97\" y2=\"14\"/><line class=\"ln2\" x1=\"87\" y1=\"50\" x2=\"97\" y2=\"50\"/><rect class=\"a\" x=\"84.0\" y=\"26.0\" width=\"16.0\" height=\"14.0\" rx=\"1\"/><line class=\"md\" x1=\"84\" y1=\"32\" x2=\"100\" y2=\"32\"/></svg>",
  "tip": "데이터 분포(사분위수)와 이상값"
 },
 "폭포": {
  "svg": "<svg viewBox=\"0 0 120 80\" aria-hidden=\"true\"><path class=\"ax\" d=\"M14 8V70H112\"/><rect class=\"a\" x=\"18.0\" y=\"30.0\" width=\"14.0\" height=\"40.0\" rx=\"1\"/><rect class=\"c\" x=\"38.0\" y=\"18.0\" width=\"14.0\" height=\"12.0\" rx=\"1\"/><rect class=\"e\" x=\"58.0\" y=\"18.0\" width=\"14.0\" height=\"16.0\" rx=\"1\"/><rect class=\"e\" x=\"78.0\" y=\"34.0\" width=\"14.0\" height=\"8.0\" rx=\"1\"/><rect class=\"a\" x=\"98.0\" y=\"42.0\" width=\"14.0\" height=\"28.0\" rx=\"1\"/></svg>",
  "tip": "값이 더해지고 빠지는 누적 과정"
 },
 "깔때기": {
  "svg": "<svg viewBox=\"0 0 120 80\" aria-hidden=\"true\"><rect class=\"a\" x=\"12.0\" y=\"10.0\" width=\"96.0\" height=\"12.0\" rx=\"1\"/><rect class=\"a\" x=\"23.0\" y=\"25.0\" width=\"74.0\" height=\"12.0\" rx=\"1\"/><rect class=\"a\" x=\"34.0\" y=\"40.0\" width=\"52.0\" height=\"12.0\" rx=\"1\"/><rect class=\"a\" x=\"45.0\" y=\"55.0\" width=\"30.0\" height=\"12.0\" rx=\"1\"/></svg>",
  "tip": "단계를 거치며 줄어드는 값"
 },
 "혼합형": {
  "svg": "<svg viewBox=\"0 0 120 80\" aria-hidden=\"true\"><path class=\"ax\" d=\"M14 8V70H112\"/><rect class=\"a\" x=\"20.0\" y=\"40.0\" width=\"14.0\" height=\"30.0\" rx=\"1\"/><rect class=\"a\" x=\"43.0\" y=\"22.0\" width=\"14.0\" height=\"48.0\" rx=\"1\"/><rect class=\"a\" x=\"66.0\" y=\"48.0\" width=\"14.0\" height=\"22.0\" rx=\"1\"/><rect class=\"a\" x=\"89.0\" y=\"14.0\" width=\"14.0\" height=\"56.0\" rx=\"1\"/><polyline class=\"ln3\" points=\"27,40 50,24 73,34 96,14\"/><circle class=\"c\" cx=\"27\" cy=\"40\" r=\"2.6\"/><circle class=\"c\" cx=\"50\" cy=\"24\" r=\"2.6\"/><circle class=\"c\" cx=\"73\" cy=\"34\" r=\"2.6\"/><circle class=\"c\" cx=\"96\" cy=\"14\" r=\"2.6\"/></svg>",
  "tip": "두 종류 이상의 차트를 함께. 특정 계열 강조, 보조 축"
 },
 "원형 대 원형": {
  "svg": "<svg viewBox=\"0 0 120 80\" aria-hidden=\"true\"><path class=\"a\" d=\"M36 40L36.0 14.0A26 26 0 0 1 36.0 66.0Z\"/><path class=\"b\" d=\"M36 40L36.0 66.0A26 26 0 0 1 11.3 32.0Z\"/><path class=\"c\" d=\"M36 40L11.3 32.0A26 26 0 0 1 36.0 14.0Z\"/><line class=\"ln2\" x1=\"58\" y1=\"30\" x2=\"86\" y2=\"28\"/><line class=\"ln2\" x1=\"58\" y1=\"50\" x2=\"86\" y2=\"52\"/><path class=\"c\" d=\"M96 40L96.0 27.0A13 13 0 0 1 96.0 53.0Z\"/><path class=\"d\" d=\"M96 40L96.0 53.0A13 13 0 0 1 83.6 36.0Z\"/><path class=\"e\" d=\"M96 40L83.6 36.0A13 13 0 0 1 96.0 27.0Z\"/></svg>",
  "tip": "작은 조각들을 모아 보조 원형으로"
 },
 "원형 대 가로 막대형": {
  "svg": "<svg viewBox=\"0 0 120 80\" aria-hidden=\"true\"><path class=\"a\" d=\"M36 40L36.0 14.0A26 26 0 0 1 36.0 66.0Z\"/><path class=\"b\" d=\"M36 40L36.0 66.0A26 26 0 0 1 11.3 32.0Z\"/><path class=\"c\" d=\"M36 40L11.3 32.0A26 26 0 0 1 36.0 14.0Z\"/><line class=\"ln2\" x1=\"58\" y1=\"30\" x2=\"90\" y2=\"16\"/><line class=\"ln2\" x1=\"58\" y1=\"50\" x2=\"90\" y2=\"64\"/><rect class=\"c\" x=\"90.0\" y=\"16.0\" width=\"20.0\" height=\"20.0\" rx=\"1\"/><rect class=\"d\" x=\"90.0\" y=\"36.0\" width=\"20.0\" height=\"16.0\" rx=\"1\"/><rect class=\"e\" x=\"90.0\" y=\"52.0\" width=\"20.0\" height=\"12.0\" rx=\"1\"/></svg>",
  "tip": "작은 조각들을 모아 보조 가로 막대로"
 }
};
window.CHART_PATTERNS = [["원형 대 가로 막대형", "원형\\s*대\\s*가로\\s*막대"], ["원형 대 원형", "원형\\s*대\\s*원형"], ["세로 막대형", "세로\\s*막대"], ["가로 막대형", "가로\\s*막대"], ["꺾은선형", "꺾은선|꺽은선"], ["도넛형", "도넛형"], ["분산형", "분산형|XY\\s*\\(?분산"], ["방사형", "방사형"], ["영역형", "영역형"], ["표면형", "표면형"], ["주식형", "주식형"], ["거품형", "거품형"], ["히스토그램", "히스토그램"], ["트리맵", "트리맵"], ["선버스트", "선버스트"], ["상자 수염", "상자\\s*수염"], ["폭포", "폭포\\s*(차트|형)"], ["깔때기", "깔때기"], ["혼합형", "혼합형|콤보"], ["원형", "원형\\s*(차트|은|는|에|의|으로)"]];
