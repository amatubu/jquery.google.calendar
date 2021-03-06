/**
 * jquery.google.calendar.js    v2.0
 *
 * Copyright (c) 2013-2014 Naoki IIMURA
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 *
 */
(function($){
  $.fn.calendar = function(options){
    var defaults = {
      api_key    : '{YOUR_API_KEY}',

      prev_month : '#prev_month',
      next_month : '#next_month',
      cal_year   : '#cal_year',
      cal_month  : '#cal_month',
      cal_table  : '#cl table.table-ca',
      cal_loading : '#cal_loading',

      cal_closed : 'jquery.calendar%40gmail.com',
      cal_holiday : 'ja.japanese%23holiday%40group.v.calendar.google.com',

      cal_header : '<tr><th>日<\/th><th>月<\/th><th>火<\/th><th>水<\/th><th>木<\/th><th>金<\/th><th>土<\/th><\/tr>',
      cal_holiday_class : 'holiday',
      cal_closed_class  : 'closed',

      cal_start_date : new Date(),
      cal_min_date : new Date( 2013, 10-1, 1 ),
      cal_max_date : null
    };
    var opts = $.extend(defaults, options);

    // 前の月
    $(opts.prev_month).click(function(){
      var year = parseInt($(opts.cal_year).text(), 10);
      var month = parseInt($(opts.cal_month).text(), 10);
      if ( month == 1 ) {
        year--;
        month = 12;
      } else {
        month--;
      }

      if ( opts.cal_min_date && opts.cal_min_date > new Date( year, month-1, 1 ) ) {
        // 有効範囲外
      } else {
        $(opts.cal_year).text(year);
        $(opts.cal_month).text(month);

        create_calender( year, month, opts );
      }

      return false;
    });

    // 次の月
    $(opts.next_month).click(function(){
      var year = parseInt($(opts.cal_year).text(), 10);
      var month = parseInt($(opts.cal_month).text(), 10);
      if ( month == 12 ) {
        year++;
        month = 1;
      } else {
        month++;
      }

      if ( opts.cal_max_date && opts.cal_max_date < new Date( year, month-1, 1 ) ) {
        // 有効範囲外
      } else {
        $(opts.cal_year).text(year);
        $(opts.cal_month).text(month);

        create_calender( year, month, opts );
      }

      return false;
    });

    // 日付から年・月を得る
    var year = opts.cal_start_date.getFullYear();
    var month = opts.cal_start_date.getMonth()+1;
    $(opts.cal_year).text(year);
    $(opts.cal_month).text(month);

    // カレンダーを更新
    create_calender( year, month, opts );

    // カレンダーを表示
    $(this).show();

    return this;
  };

  // カレンダーを作成する
  function create_calender(year, month, opts) {
    // 月の最初の日の曜日を調べる
    var first_date = new Date(year, month-1, 1); // 月は-1する
    var first_day = first_date.getDay(); // 0:日曜日、...

    // 月の最後の日を調べる
    var last_date = new Date(year, month, 0); // 翌月の0日＝当月の最終日
    var last_date_date = last_date.getDate();

    // カレンダーのヘッダ
    var header = opts.cal_header;
    var body = "";

    // カレンダーの内容を作成
    var i, w;
    for ( i = 0; i + 1 - first_day <= last_date_date; i+=7 ) {
      body += "<tr>";
      for ( w = 0; w < 7; w++ ) {
        // 設定する日付
        var d = i + 1 + w - first_day;
        // 当月内でなければ何も表示しない（&nbsp;とする）
        if ( d < 1 || d > last_date_date ) d = String.fromCharCode( 160 );
        body += "<td>" + d + "<\/td>";
      }
      body += "<\/tr>";
    }

    // カレンダーの内容を設定する
    $(opts.cal_table).html( header + body );

    // 日曜日
    for ( i = 0; i + 1 - first_day <= last_date_date; i+=7 ) {
      if ( i + 1 - first_day < 1 ) continue;
      $(opts.cal_table+" td:eq("+i+")").addClass(opts.cal_holiday_class);
    }

    // 取得する日付の範囲
    var min_date = date_format( year, month, 1 );
    var next_date = new Date(year, month, 1);
    var max_date = date_format( next_date.getFullYear(), next_date.getMonth()+1, 1 );

    var loading = 2;
    $(opts.cal_loading).show();

    // 休館日の情報を得る
    $.getJSON('https://www.googleapis.com/calendar/v3/calendars/'+opts.cal_closed+'/events?key='+opts.api_key+'&orderBy=startTime&singleEvents=true&timeMin='+min_date+'&timeMax='+max_date+'&callback=?', function (json) {
      if ( json.items ) {
        update_date_class( json.items, opts.cal_closed_class, opts.cal_holiday_class, opts );
      }
      loading--;
      if ( loading == 0 ) {
        $(opts.cal_loading).hide();
      }
    });

    // 祝日の情報を得る
    $.getJSON('https://www.googleapis.com/calendar/v3/calendars/'+opts.cal_holiday+'/events?key='+opts.api_key+'&orderBy=startTime&singleEvents=true&timeMin='+min_date+'&timeMax='+max_date+'&callback=?', function (json) {
      if ( json.items ) {
        update_date_class( json.items, opts.cal_holiday_class, null, opts );
      }
      loading--;
      if ( loading == 0 ) {
        $(opts.cal_loading).hide();
      }
    });

    // 次の月、前の月の有効、無効を切り替える
    if ( opts.cal_min_date && opts.cal_min_date > new Date( year, month-1-1, 1 ) ) {
      $(opts.prev_month).hide();
    } else {
      $(opts.prev_month).show();
    }
    if ( opts.cal_max_date && opts.cal_max_date < new Date( year, month-1+1, 1 ) ) {
      $(opts.next_month).hide();
    } else {
      $(opts.next_month).show();
    }
  };

  // 日付をISO8601拡張表記（YYYY-MM-DDThh:mm:ss+zone）に
  function date_format( year, month, day ) {
    if ( month < 10 ) { month = "0" + month; }
    if ( day   < 10 ) { day   = "0" + day;   }

    return year + "-" + month + "-" + day + "T00%3A00%3A00Z";
  };

  // 各日付のクラスを更新
  function update_date_class( items, applyClass, removeClass, opts ) {
    var year = parseInt($(opts.cal_year).text(), 10);
    var month = parseInt($(opts.cal_month).text(), 10);
    var first_date = new Date(year, month-1, 1); // 月は-1する
    var first_day = first_date.getDay(); // 0:日曜日、...

    // 適用するクラスがオブジェクトかどうか
    var applyClass_is_object = Object.prototype.toString.call(applyClass) == "[object Object]";

    // 得られた予定情報を処理
    $.each(items,function(i){
      // 予定の開始日だけを見る
      var st = items[i].start.date;
      var dt = st.match(/(\d{4})-(\d{2})-(\d{2})/);
      if ( dt ) {
        // 当月の予定だけを処理
        if ( parseInt(dt[1],10) == year && parseInt(dt[2],10) == month ) {
          // カレンダー上の該当場所に指定クラスを適用する
          var index = parseInt(dt[3], 10) + first_day - 1;

          // 適用するクラスがオブジェクトならば、予定の内容により適用するクラスを変える
          var ac;
          if ( applyClass_is_object ) {
            ac = applyClass[items[i].summary];
            // 該当する項目がなければ、デフォルト設定を利用
            if ( !ac ) {
              ac = applyClass["default"];
            }
          } else {
            ac = applyClass;
          }
          $(opts.cal_table+" td:eq("+index+")").addClass(ac).removeClass(removeClass);
        }
      }
    });
  };
})(jQuery);
