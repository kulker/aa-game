 /*
 * HTML 5 Game - AA Game  
 * http://www.kurtulusulker.com.tr
 * Copyright (C) 2015 by Kurtulus Ulker , kurtulus.ulker@gmail.com
 * Licensed under the MIT or GPL Version 2 licenses.
 */
           var canvas = document.getElementById('canvas');
           var ctx = canvas.getContext('2d');
           var raf;
           var remainingNewCol = null;

           var globalConf = {
               centerCoord: { 'x': canvas.width / 2, 'y': (canvas.height / 2) - 70 },
               linewidth: 0.5,
               col_width: 140,
               col_point_radius: 8,
               step: 0.1 / 2,
               interval: 5
           }


           var mainBgColor = "white";
            function getShootingLimit() {
               return ( globalConf.col_width * 2) + 40
            }
           var currentLevelIndex = 1;
           var currentLevel = null;
           var tmpIslog = false;
           var lastShutZoneColIndex = false;
           var isGameOver = false;
           var isSuccess = false;
           var globalCounter = 0;

           function level(no, step, col_count, direction, newColCount, levelExtra) {
               this.no = no;
               this.step = step;
               this.first_step = step;
               this.col_count = col_count;
               this.org_col_count = col_count;
               this.direction = direction;
               this.new_col_count = newColCount
               this.cols = [];
               for (var c = 0; c < col_count; c++) {
                   this.cols[c] = (360 / col_count) * c;
               }
               this.cols_xy = [];
               this.cols_isShootZone = [];
               this.levelExtra = levelExtra;

               return this;
           }

           function getShutZone() {
               var shutCoord = {
                   x1: (globalConf.centerCoord.x -  (globalConf.col_point_radius / 2)-9),
                   x2: (globalConf.centerCoord.x + (globalConf.col_point_radius / 2)+9),
                   y1: globalConf.centerCoord.y + globalConf.col_width-8,
                   y2: globalConf.centerCoord.y + globalConf.col_width-8
               }
               return shutCoord;
           }
           var level_extra = [
              /*0*/ { 'changeDirectionSecondPeriod': 0, 'changeStepPerSecond': 0, 'isAccelerationStep': false, 'clearColCount': 1 },
              /*1*/ { 'changeDirectionSecondPeriod': 0, 'changeStepPerSecond': 0, 'isAccelerationStep': false, 'clearColCount': 2 },
              /*2*/ { 'changeDirectionSecondPeriod': 0, 'changeStepPerSecond': 0, 'isAccelerationStep': true, 'clearColCount': 3 },
              /*3*/ { 'changeDirectionSecondPeriod': 10, 'changeStepPerSecond': 0, 'isAccelerationStep': false, 'clearColCount': 1 },
              /*4*/ { 'changeDirectionSecondPeriod': 0, 'changeStepPerSecond': 3, 'isAccelerationStep': false, 'clearColCount': 1 },
              /*5*/ { 'changeDirectionSecondPeriod': 7, 'changeStepPerSecond': 0, 'isAccelerationStep': true, 'clearColCount': 2 },

              /*6*/ { 'changeDirectionSecondPeriod': 10, 'changeStepPerSecond': 5, 'isAccelerationStep': false, 'clearColCount': 0 }
           ];

           var levels_setting = [
               { 'no': 1, 'step': 0.2, 'col_count': 4, 'direction': 'r', 'newColCount': 3 ,'levelExtra':null },
               { 'no': 2, 'step': 0.3, 'col_count': 6, 'direction': 'r', 'newColCount': 5, 'levelExtra': null },
               { 'no': 3, 'step': 0.35, 'col_count': 8, 'direction': 'r', 'newColCount': 6,'levelExtra': level_extra[5]},
               { 'no': 4, 'step': 0.5, 'col_count': 10, 'direction': 'l', 'newColCount': 7,'levelExtra': level_extra[4]},
               { 'no': 5, 'step': 0.5, 'col_count': 10, 'direction': 'l', 'newColCount': 9, 'levelExtra': level_extra[4]},
               { 'no': 6, 'step': 0.7, 'col_count': 12, 'direction': 'r', 'newColCount': 10, 'levelExtra': level_extra[5]}
           ];

          


       function getLevel(levelNo) {
           if (levels_setting[levelNo - 1]) {
               globalCounter = 0;
               var nL = levels_setting[levelNo - 1];
               remainingNewCol = nL.newColCount;            
               return new level(nL.no, nL.step, nL.col_count, nL.direction, nL.newColCount, nL.levelExtra);

            }
               return false;
       }


       currentLevel = getLevel(currentLevelIndex);
        
           function colsCalcArea(col1Index, col2Index) {
               if (levels[currentLevel].cols_xy[col1Index] && levels[currentLevel].cols_xy[col2Index]) {
                   var A = levels[currentLevel].cols_xy[col1Index];
                   var B = globalConf.centerCoord;
                   var C = levels[currentLevel].cols_xy[col2Index];

                   return Math.abs((A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y)) / 2);
               } else
                   return 0;
           }
           var shutZone = getShutZone();

           function isClosedShootingZone() {
               for (var x = 0; x < currentLevel.cols_isShootZone.length; x++) {
                   if (currentLevel.cols_isShootZone[x] === true) return false;
               }
               return true;
           }

           function lineToAngle(ctx, x1, y1, length, angle,colIndex) {
               var angle_o = angle;
					angle *= Math.PI / 180;
					var x2 = x1 + length * Math.cos(angle),
						y2 = y1 + length * Math.sin(angle);
					ctx.beginPath();
					/*if (isGameOver)
					    ctx.strokeStyle = "red";
					else
                    */
					    ctx.strokeStyle = "black";
					ctx.lineCap = "round";
					ctx.lineWidth = globalConf.linewidth;
					ctx.moveTo(x1, y1);
					ctx.lineTo(x2, y2);
					ctx.stroke();
					ctx.closePath();

					if (isGameOver) gameOver();

					if (x2 >= shutZone.x1 && x2 <= shutZone.x2 && y2 >= shutZone.y1) {
					    //  ctx.strokeStyle = "red";					
					    lastShutZoneColIndex = colIndex;
					    currentLevel.cols_isShootZone[colIndex] = true;
					} else
					    currentLevel.cols_isShootZone[colIndex] = false;

					return {x: x2, y: y2};
	        }
	      

			var startAngel=0; // 270 bir  tur
			var raf = null;
			var colDirection = 1;
			function startGame() {
			    isSuccess = isGameOver = false;

			    canvas.style.backgroundColor = 'black';
			    colDirection = 1;
			    if (currentLevel.direction == 'r')
			        colDirection = colDirection * -1;
			    mainBgColor = "white";

			    console.log(currentLevel.levelExtra);

			    drawNewColPoints();
			   

			    raf = setInterval(function () {

			        if (isGameOver)
			            mainBgColor = "#D04141";
			        else {
			            if (isSuccess)
			                mainBgColor = "#77B277";
                          else 
    			            mainBgColor = "white";
			        }

			        cls();
			        for (var b = 0; b < currentLevel.cols.length; b++) {

			        
			            currentLevel.cols[b] += currentLevel.step;

			            var pos = lineToAngle(ctx, globalConf.centerCoord.x, globalConf.centerCoord.y, globalConf.col_width, colDirection*currentLevel.cols[b], b);
			            currentLevel.cols_xy[b] = { 'x': pos.x.toFixed(4), 'y': pos.y.toFixed(4) };
			           
			            ctx.beginPath();
			            if (b + 1 > currentLevel.org_col_count)
			                ctx.fillStyle = "rgb(3, 68, 3)";
                        else 
			                ctx.fillStyle = "black";

			            ctx.arc(pos.x, pos.y, globalConf.col_point_radius, 0, Math.PI * 2, true);
			            ctx.fill();
			         /*   if (b+1 > currentLevel.org_col_count) {
			                ctx.font = "8px Georgia";
			                ctx.fillStyle = "#fff";
			                ctx.fillText((remainingNewCol + (b - currentLevel.org_col_count)), pos.x - 2, pos.y + 2);
			            }
                        */

			            ctx.closePath();
			           /*

			            if (tmpIslog) {
			                if (b == 0 && startAngel.toFixed(0) % 4 == 0) //'angel:' + (startAngel > 360) ? (startAngel % 360) : startAngel + 
			                    document.getElementById('line_log').innerText = ' x:' + pos.x.toFixed(2) + ' ,y:' + pos.y.toFixed(2);
			            }
                        */
			        }
			        drawMainDisc();			        
			        if (isSuccess) success();
			        globalCounter++;
			        setLevelExtra();
			    }, globalConf.interval);
			}

			function setLevelExtra() {
			    if (currentLevel.levelExtra !== null) {
			        var pastTime=globalCounter / (1000/globalConf.interval);

			        if (currentLevel.levelExtra.changeDirectionSecondPeriod > 0 &&
                        (pastTime > 0 && pastTime % currentLevel.levelExtra.changeDirectionSecondPeriod === 0)) {			           
			            colDirection = colDirection * -1;			            
			        }

			        if (currentLevel.levelExtra.changeStepPerSecond > 0 &&
                        (pastTime > 0 && pastTime % currentLevel.levelExtra.changeStepPerSecond === 0)) {
			            if (currentLevel.step === currentLevel.first_step)
			                currentLevel.step += (currentLevel.step * 45) / 100;
			            else
			                currentLevel.step = currentLevel.first_step;

			        }

			    }
			}
		
			function drawNewColPoints() {
			    //remainingNewCol .. buaradan devam et
			    ctx.beginPath();
			    ctx.fillStyle = mainBgColor;
			    ctx.fillRect(0, getShootingLimit(), canvas.width, canvas.height);
			    ctx.fillStyle = "black";
			    ctx.save();
			    if (remainingNewCol > 0) {
			        var startY = getShootingLimit() + 8;
			        for (var n = 0; n < ((remainingNewCol < 4) ? remainingNewCol : 4) ; n++) {

			            ctx.beginPath();
			            ctx.fillStyle = "black";
			            ctx.arc(globalConf.centerCoord.x, startY, globalConf.col_point_radius, 0, Math.PI * 2, true);
			            ctx.fill();
			            ctx.font = "8px Georgia";
			            ctx.fillStyle = "#fff";
			            ctx.fillText((remainingNewCol - n), globalConf.centerCoord.x - 2, startY + 2);
			            ctx.closePath();
			            startY += (globalConf.col_point_radius * 2) + 8;
			        }
			    }

			}
			function cls() {
			    ctx.beginPath();			 
			    ctx.fillStyle = mainBgColor;
			    ctx.fillRect(0, 0, canvas.width, getShootingLimit());
			    ctx.fillStyle = "black";
			    ctx.save();
			    ctx.restore();
			}

			function drawMainDisc() {
			    ctx.fillStyle = "black";
			    ctx.arc(globalConf.centerCoord.x, globalConf.centerCoord.y, 35, 0, Math.PI * 2, true);
			    ctx.fill();//ctx.fill();
			    ctx.fillStyle = "white";
			    ctx.font = "16px Georgia";
			    ctx.fillText(currentLevel.no, globalConf.centerCoord.x - (5 * currentLevel.no.toString().length), globalConf.centerCoord.y+3);
			    ctx.closePath();
			}

		/*canvas.addEventListener('dblclick', function (evt) {
		    tmpIslog = !tmpIslog;
		});
        */
         
		function gameOver() {
		    clearInterval(raf);
		    ctx.save();
		    ctx.restore();
		    ctx.beginPath();
		    ctx.lineCap = "round";
		    ctx.lineWidth = globalConf.linewidth;
		    ctx.fillStyle = "black";
		    ctx.arc(globalConf.centerCoord.x, globalConf.centerCoord.y + globalConf.col_width + globalConf.col_point_radius, globalConf.col_point_radius-1, 0, Math.PI * 2, true);
		    
		    ctx.fill();		  
		    ctx.closePath();
		    drawNewColPoints();
		}
		function success() {
		    mainBgColor = "#77B277";
		    clearInterval(raf);
		    drawNewColPoints();
		    currentLevelIndex++;
		}

		function shooting() {
		    remainingNewCol--;
		    drawNewColPoints();
		    if (isClosedShootingZone()) {                
		        //    currentLevel.cols[currentLevel.cols.length] = 90;		
		       /* if (lastShutZoneColIndex>0)
		            currentLevel.cols.splice(lastShutZoneColIndex, 0, colDirection * 90);
		        else*/
		            currentLevel.cols[currentLevel.cols.length] = colDirection * 90
		            currentLevel.col_count++;
		            if (remainingNewCol == 0) {
		                isSuccess = true;
		            }

		    } else
		        isGameOver = true;
		}
        canvas.addEventListener('click', function (evt) {
            //console.log(isShutZone);
            shooting();

           
		});