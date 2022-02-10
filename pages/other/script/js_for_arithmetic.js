 const ADDITION = "addition";
 const SUBTRACTION = "subtraction";
 const MULTIPLICATION = "multiplication";
 const DIVISION = "division";
 const ARITHMETIC_SUM = 10;
 const DEFAULT_MAX_NUMBER = 20;
 
 var arithmeticObject = {addition:false, subtraction:false, multiplication:false, division:false};
 var arithmeticResultArray = new Array;
 var startTime;
 
 function randomArithmetic(isAddition, isSubtraction, isMultiplication, isDivision) {
	 arithmeticObject.addition = isAddition;
	 arithmeticObject.subtraction = isSubtraction;
	 arithmeticObject.multiplication = isMultiplication;
	 arithmeticObject.division = isDivision;
	 let useArithmeticArray = new Array;
	 for (keyName in arithmeticObject) {
		 if (arithmeticObject[keyName]) {
			useArithmeticArray[useArithmeticArray.length] = keyName;
		 }
	 }
	 if (useArithmeticArray.length > 0) {
		 let methodIndex = Math.floor(Math.random()*useArithmeticArray.length);
		 // console.log(useArithmeticArray);
		 // console.log(methodIndex);
		 return useArithmeticArray[methodIndex];
	 } else {
		 return "error";
	 }	 
 }
 
 function createExpression(arithmeticMethod, maxNumber, isAllowNegative, isAllowDecimals) {
	 let numA = Math.floor(Math.random()*maxNumber);
	 let numB = Math.floor(Math.random()*maxNumber);
	 
	 if (arithmeticMethod == ADDITION) {
		 arithmeticResultArray.push(numA + numB);
		 return numA + " + " + numB + " = ";
	 } else if (arithmeticMethod == SUBTRACTION) {
		 if (numA >= numB || isAllowNegative) {
			 arithmeticResultArray.push(numA - numB);
			 return numA + " - " + numB + " = ";
		 } else {
			 arithmeticResultArray.push(numB - numA);
			 return numB + " - " + numA + " = ";
		 }
	 } else if (arithmeticMethod == MULTIPLICATION) {
		 arithmeticResultArray.push(numB * numA);
		 return numA + " x " + numB + " = ";
	 } else if (arithmeticMethod == DIVISION) {
		 let expression = numA + " ÷ " + numB + " = ";
		 if (isAllowDecimals && numB != 0) {
			 let divisionResult = numA/numB;
			 let dotIndex = String(divisionResult).indexOf(".");
			 if (dotIndex >= 0) {
				 if (String(divisionResult).length - dotIndex - 1 > 3) {
					 divisionResult = divisionResult.toFixed(3);
				 } 
			 }
			 arithmeticResultArray.push(divisionResult);
			 return expression;
		 } else {
			 let numResult = numA/numB;
			 if (numA < numB) {
				 numResult = numB/numA;
				 expression = numB + " ÷ " + numA + " = ";
			 }
			 if (/*String(numResult).indexOf(".") >= 0*/ Number.isInteger(numResult) || !isFinite(numResult)) {
				return createExpression(DIVISION, maxNumber, isAllowNegative, isAllowDecimals);
			 } else {
				 arithmeticResultArray.push(numResult);
				 return expression;
			 }
		 }
	 } else {
		 // alert("This method is not support:" + arithmeticMethod);
		 return "error";
	 }
 }
 
 function submit_start(form) {
	 let formData = new FormData(form);
	 let maxNumber = formData.get("max_number");
	 if (maxNumber <= 0) {
		 maxNumber = DEFAULT_MAX_NUMBER;
	 }
	 let isAddition = formData.get("cb_addition") == "true";
	 let isSubtraction = formData.get("cb_subtraction") == "true";
	 let isMultiplication = formData.get("cb_multiplication") == "true";
	 let isDivision = formData.get("cb_division") == "true";
	 let isAllowNegative = formData.get("ra_allow_negative") == "true";
	 let isAllowDecimals = formData.get("ra_allow_decimals") == "true";
	 
	 // alert("收到了:" + maxNumber + "," + isAddition + "," + isSubtraction + "," + isMultiplication + "," + isDivision + "," + isAllowNegative + "," + isAllowDecimals);
	 
	 if (!(isAddition || isSubtraction || isMultiplication || isDivision)) {
		 alert("请选择一种运算类型！！!");
		 return false;
	 }
	 
	 
	 document.getElementById("form_div").style.display = "none";
	 document.getElementById("result_div").style.display = "none";
	 document.getElementById("test_div").style.display = "";
	 let testFormContent = "<p>以下是口算题:</p>";
	 arithmeticResultArray = new Array;
	 for (let i=0; i<ARITHMETIC_SUM; i++) {
		 // console.log(createExpression(randomArithmetic(isAddition, isSubtraction, isMultiplication, isDivision), maxNumber, isAllowNegative, isAllowDecimals));
		 // document.writeln(createExpression(randomArithmetic(isAddition, isSubtraction, isMultiplication, isDivision), maxNumber, isAllowNegative, isAllowDecimals));
		 let expressString = createExpression(randomArithmetic(isAddition, isSubtraction, isMultiplication, isDivision), maxNumber, isAllowNegative, isAllowDecimals);
		 testFormContent += '<p id="formp' + i + '">' + expressString + '<input name="formi_name' + i + '" id="formi_id' + i +'" type="number" step=0.001 size=6/></p>';
		 
	 }
	 testFormContent += '<input type="submit" id="formsi" value="提交"/>';
	 console.log(testFormContent);
	 document.getElementById("test_form").innerHTML = testFormContent;
	 startTime = new Date();
	 return false;
 }
 
 function submit_test(form) {
	 //叉10060，圈11093，勾10004
	 let nowTime = new Date();
	 let formData = new FormData(form);
	 // console.log(arithmeticResultArray);
	 // console.log(formData);
	 let wrongNum = 0;
	 for (let i=0; i<ARITHMETIC_SUM; i++) {
		 let result = formData.get("formi_name"+i);
		 let emojiStr = "   &#10004;";
		 if (result != arithmeticResultArray[i]) {
			 emojiStr = "   &#10060;";
			 wrongNum++;
		 }
		 let originp = document.getElementById("formp"+i).innerHTML;
		 originp += emojiStr;
		 // console.log(originp);
		 // console.log(document.getElementById("formi_id"+i).value);		 
		 document.getElementById("formp"+i).innerHTML = originp;
		 // console.log("result:"+result +","+ (typeof +result));
		 document.getElementById("formi_id"+i).value = result;
	 }
	 if (wrongNum == 0) {
		 document.getElementById("formsi").style.display = "none";
		 document.getElementById("result_div").style.display = "";
		 let useTime = (nowTime - startTime)/1000;
		 document.getElementById("result_div_p1").innerHTML = "总共用了" + useTime + "秒";
	 }
	 return false;
 }
 
 function restartButtonClick() {
	 location.reload();
 }