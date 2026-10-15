// 시험 설정 - 컴퓨터활용능력 1급 필기 (HAE)
window.EXAM={
 key:'c1', name:'컴퓨터활용능력 1급 필기', short:'컴활 1급', brand:'컴활1급 필기 특훈', brandSub:'COMPUTER SPECIALIST · LEVEL 1 · WRITTEN',
 subj:['','컴퓨터 일반','스프레드시트 일반','데이터베이스 일반'], per:20, min:60, store:'comhwal1_v1', cbtOrg:'상공회의소',
 isMain:(s,Q)=>{const q=Q.find(x=>x.set===s);return q.id[0]==='K'||q.id[0]==='M';},
 hide:s=>s==='추가 문제',
 setLabel:s=>s.replace('2024 기출','2024 상시'),
 mainLabel:'회차별 시험지', oldLabel:'지난 기출 2010~2020', oldNote:'옛날 시험이라 지금 시험 범위가 아닌 문제는 ‘옛 버전 내용’ 표시가 붙어요. 랜덤 실전 모의고사에는 빠져요.', hasOb:true,
 rand:{K:{t:'기출만',d:'2024 상시 + 지난 기출 2010~2020',f:q=>q.id[0]!=='M'},A:{t:'기출+모의',d:'모든 문제',f:()=>true}},
 cramSrc:[{v:'K',l:'2024 상시 기출',f:q=>q.id[0]==='K'},{v:'M',l:'실전 모의고사',f:q=>q.id[0]==='M'},{v:'O',l:'지난 기출 2010~2020 전체',f:q=>q.id[0]==='O'||q.id[0]==='X'}],
 statLine:Q=>`(2024 상시 ${Q.filter(q=>q.id[0]==='K').length} + 실전 모의 ${Q.filter(q=>q.id[0]==='M').length} + 지난 기출 ${Q.filter(q=>q.id[0]==='O'||q.id[0]==='X').length})`,
 pdfs:{full:{url:'pdf/comhwal1-summary.pdf',name:'comhwal1-summary.pdf'},top:{url:'pdf/comhwal1-top.pdf',name:'comhwal1-top.pdf'},cram:{url:'pdf/comhwal1-cram.pdf',name:'comhwal1-cram.pdf'}},
 cramPdfNote:'2024 상시+모의 580문항'
};
