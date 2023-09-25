import {SERVER_URL, LIFF_ID} from "./config.js";

class Calendar{//カレンダーの編集に関するクラス
	constructor(){
		this.shift;// = new Shift();

		const today = new Date();
		this.firstDate = new Date(today.getFullYear(),today.getMonth(),1);//その月の一日

		//カレンダーのタイトル「ー年ー月」をつくる。
		const year = this.firstDate.getFullYear();
		const month = this.firstDate.getMonth() + 1;//Dateクラスは1月が0からはじまるため1を足す。
		document.getElementById("yearandmonth").innerHTML = year + "年" + month + "月";

	}
	// goPreviousMonth(){}
	// goNextMonth(){}
	setShift(shiftObject){
		this.shift = shiftObject;
		this.workstyle = this.shift.WORKSTYLE;
	}
	createCalendarTable(){//
		const week = ["日","月","火","水","木","金","土"];
		const dayOfTheFirstDate_day = this.firstDate.getDay();
			//一日の曜日を表す整数。
			//0:日, 1:月, 2:火, 3:水, 4:木, 5:金, 6:土 と対応する
		const lastDateOfTheMonth_date = new Date(this.firstDate.getFullYear(), this.firstDate.getMonth() + 1, 0).getDate();
			//今月の最終日を表す整数
			//0:先月の最終日, 1:1日, ...x:x日,...と対応する
		const lastDateOfLastMonth_date = new Date(this.firstDate.getFullYear(), this.firstDate.getMonth(), 0).getDate();
			//先月の最終日を表す整数
		const NumberOfRows = Math.ceil((dayOfTheFirstDate_day + lastDateOfTheMonth_date)/week.length);//カレンダーの行数
		let calendarTable_HTMLDocument = "";
		let date;
		//テーブルを作成
		calendarTable_HTMLDocument += "<table>";
		calendarTable_HTMLDocument += "<tr class='dayOfWeek'>";
		for(let i = 0; i < week.length; i++){
			calendarTable_HTMLDocument += "<th>" + week[i] + "</th>";//見出し部分に曜日を並べます
		};
		calendarTable_HTMLDocument += "</tr>";

		for(let row = 0; row < NumberOfRows; row++){
			calendarTable_HTMLDocument += "<tr>";
			for(let colum = 0; colum < week.length; colum++){
				const cellNumber = row * week.length + colum;//左上端から0を初めにして数えた番号
				if(cellNumber < dayOfTheFirstDate_day){
					date = lastDateOfLastMonth_date + 1 - dayOfTheFirstDate_day + colum;
					calendarTable_HTMLDocument += "<td class='dayOfLastMonth' satus='"+this.workstyle[0]+"'>" + date + "</td>";
				}else if(cellNumber >= dayOfTheFirstDate_day && cellNumber <= dayOfTheFirstDate_day + lastDateOfTheMonth_date){
					date = cellNumber + 1 - dayOfTheFirstDate_day;
					calendarTable_HTMLDocument += "<td id='"+date+"' class='dayOfTheMonth' status='"+this.workstyle[0]+"'>" + date + "</td>";
				}else if(cell >= dayOfTheFirstDate_day && cell > dayOfTheFirstDate_day + lastDateOfTheMonth_date){
					date = cellNumber - dayOfTheFirstDate_day - lastDateOfTheMonth_date;
					calendarTable_HTMLDocument += "<td class='dayOfNextMonth' status='"+this.workstyle[0]+"'>" + date + "</td>"
				}
			}
			calendarTable_HTMLDocument += "</tr>";
		};
		calendarTable_HTMLDocument += "</table>";

		document.getElementById("calendarTable").innerHTML = calendarTable_HTMLDocument;
		//イベントを追加する。
		const TableOfTheMonth = document.getElementsByClassName("dayOfTheMonth");
		for(let i = 0; i < TableOfTheMonth.length; i++){
			TableOfTheMonth[i].addEventListener("click",(e)=>{this.#onClick(e)});
		};
	}
	#changeStatusAttribute(date, newStatus){
		document.getElementById(date).setAttribute("status", newStatus);
	}
	#onClick(e){
		const status = e.target.attributes.status.value;//status属性の値
		const date = e.target.id;
		let newStatus;
		//勤務形態を変えます
		if(status == this.workstyle[0]){
			newStatus = this.workstyle[1];
		}else if(status == this.workstyle[1]){
			newStatus = this.workstyle[2];
		}else if(status == this.workstyle[2]){
			newStatus = this.workstyle[3];
		}else if(status == this.workstyle[3]){
			newStatus = this.workstyle[4];
		}else if(status == this.workstyle[4]){
			newStatus = this.workstyle[0]
		}else{
			newStatus = undefined;
		}

		this.#changeStatusAttribute(date,newStatus);//HTMLのstatus要素の値を変える。
		this.shift.changeStatus(date, newStatus);
	}
}

class Shift{//シフト管理に関するクラス
	constructor(){
		console.log("Shift()...");
		this.WORKSTYLE = ["全日","午前","午後","夜勤","休日"];
		this.userId;
		//this.UserName;
		this.userType;
		this.shiftDraft = {
			"daystatus":[,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,]
		}//daystatus[i]にはi+1日の状態が格納される
	}
	changeStatus(date, newStatus){//勤務形態を変更するメソッド
		this.shiftDraft.daystatus[date] = newStatus;
	}
	confirmShift(){//確定ボタンを押したら呼ばれるメソッド
		console.log("confirmShift()...");
		const shift_JSON = {//最終的にまとめられたシフト希望のJSONデータ
			"employee":{
				"LINEid":this.userId,
				"name":this.userName,
				"type":this.userType,
				"shift_day":[],
				"shift_night":[],
				"holiday":[]
			}
		};
		for(let i = 0; i<31; i++){
			if(this.shiftDraft.daystatus[i] == this.WORKSTYLE[0] || this.shiftDraft.daystatus[i] == undefined){
				continue;
			}else if(this.shiftDraft.daystatus[i] == this.WORKSTYLE[1]){
				shift_JSON.employee.shift_day.push({"date":i, "am-pm":"am"});
			}else if(this.shiftDraft.daystatus[i] == this.WORKSTYLE[2]){
				shift_JSON.employee.shift_day.push({"date":i, "am-pm":"pm"});
			}else if(this.shiftDraft.daystatus[i] == this.WORKSTYLE[3]){
				shift_JSON.employee.shift_night.push({"date":i});
			}else if(this.shiftDraft.daystatus[i] == this.WORKSTYLE[4]){
				shift_JSON.employee.holiday.push({"date":i});
			}
		}

		//WebAPIに投げて、Pythonに処理してもらう
		new UploadToServer.postShiftJson(shift_JSON);
		new LIFF().closeWindow;
	}
}
class UploadToServer{
	constructor(){
		console.log("UploadToApi()...");
	}
	postShiftJson(shiftData_json){
		fetch(SERVER_URL, 
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(shiftData_json)
			}
		)
		.then(
			(response) => {return response.json();}
		)
		.then(
			(data) => {
				console.log("get data");
			}
		).catch(error => {
			console.error("Error:", error);
		});
	}
}
class LIFF{
	constructor(){
		liff.init(
			{liffId: LIFF_ID}
		).then(
			() =>{
				const profile_JSON = this.getProfileJSON();
				this.sendMessagesToLine(profile_JSON.userName);
			}
		);
	}
	getProfileJSON(){//個人がLINEに登録しているプロフィールを取得するメソッド
		liff.getProfile()
		.then(
			(profile) => {
				//const userId = profile.userId;
				const userName = profile.displayName;
				return JSON.stringify(
					{
						"userName": userName,
					}
				);
			}
		).catch(
			(error) => {
				window.alart("ERROR at getProfile()", error)
			}
		);
	}
	sendMessagesToLine(userName){//アプリを開いたトークルームにメッセージを送信するメソッド
		const messages = [{
			type: "text", 
			text: userName+"がシフト希望を送信しました。"
		}];
		liff.sendMessages(messages).then(
			function(){window.alart("送信完了");}
		).catch(
			function(error){window.alert("ERROR at sendMessagesToLine()",error)}
		);
	}
	closeWindow(){
		liff.closeWindow();
	}
}
const shift = new Shift();
const calendar = new Calendar();
calendar.setShift(shift);
window.onload = calendar.createCalendarTable();
document.getElementById("confirm").addEventListener("click", (e)=> {shift.confirmShift()});//確定ボタンのクリックイベントを追加;
new LIFF();