var postUpdate=(function(){
    /**
     * 显示步骤对应的面板
     * @param {Number} stepId 需要显示的面板的id
     */
    function showStepPanel(stepId){
        $(".zyupStepPanel").addClass("zyupHidden");
        $(stepId).removeClass("zyupHidden");
        $(".zyupStepCurrent").removeClass("zyupStepCurrent");
        $(".zyupStep[href='"+stepId+"']").addClass("zyupStepCurrent");
    }
    return {
        uploadedMedia:{},
        uploadHandler:null,
        preview:function(){
            var tpl=$("#previewTpl").html(),
                files=[],html="";
            for(var obj in this.uploadedMedia){
                files.push(this.uploadedMedia[obj])
            }
            html=juicer(tpl,{
                title:$("#zyupTitleInput").val(),
                author:$("#zyupAuthorInput").val(),
                size:$("#zyupSizeInput").val(),
                explain:$("#zyupDescriptionTxt").val(),
                attachment_file:$("#zyupFileUrl").val(),
                analysis:$("#zyupAnalysisTxt").val(),
                preview:files[0]["media_file"],
                assets:files
            });
            $("#zyupPreview").html(html);
        },
        createThumbUploader:function(){
            Functions.createQiNiuUploader({
                size:config.upload.sizes.all,
                filter:config.upload.filters.img,
                btn:"zyupThumbUploadBtn",
                multipartParams:null,
                domain:config.qiNiu.uploadDomain,
                container:"zyupThumbContainer",
                uploadUrl:config.ajaxUrls.upload,
                fileAddedCallback:function(up,files){

                },
                beforeUploadCallback:null,
                progressCallback:function(file){

                },
                uploadedCallback:function(file,info){
                    var res = JSON.parse(info);
                    var path = config.qiNiu.bucketDomain + res.key; //获取上传成功后的文件的Url

                    //判断是否是1：1
                    $.get(path+"?imageInfo",function(data){
                        //console.log(data);
                        if(data.width==300&&data.height==300){
                            $("#zyupThumb").attr("src",path);
                            $("#zyupThumbUrl").val(path);
                        }else{
                            $().toastmessage("showErrorToast",config.message.imageNot300x300);
                        }

                    });
                }
            });
        },
        createFileUploader:function(){
            Functions.createQiNiuUploader({
                size:config.upload.sizes.all,
                filter:config.upload.filters.zip,
                btn:"zyupFileUploadBtn",
                multipartParams:null,
                domain:config.qiNiu.uploadDomain,
                container:"zyupFileContainer",
                uploadUrl:config.ajaxUrls.upload,
                fileAddedCallback:function(up,files){

                },
                beforeUploadCallback:null,
                progressCallback:function(file){
                    $("#zyupFilename").text(file.name+"----"+file.percent+"%");
                },
                uploadedCallback:function(file,info){
                    var res = JSON.parse(info);
                    var path = config.qiNiu.bucketDomain + res.key; //获取上传成功后的文件的Url
                    $("#zyupFilename").text(file.name);
                    $("#zyupFilenameValue").val(file.name);
                    $("#zyupFileUrl").val(path);

                }
            });
        },
        createUploader:function(){
            var me=this;
            me.uploadHandler=Functions.createQiNiuUploader({
                size:config.upload.sizes.all,
                filter:config.upload.filters.img,
                btn:"zyupUploadBtn",
                multipartParams:null,
                domain:config.qiNiu.uploadDomain,
                container:"zyupStep2",
                uploadUrl:config.ajaxUrls.upload,
                fileAddedCallback:function(up,files){
                    var tpl=$("#mediaItemTpl").html(),
                        html="";
                    if($("#zyupMediaList li").length+files.length<=4){
                        html=juicer(tpl,{
                            fileId:files[0]["id"],
                            filename:files[0]["name"]
                        });

                        $("#zyupMediaList").append(html);
                    }else{
                        $().toastmessage("showErrorToast",config.message.imageMoreThan4);
                        up.removeFile(files[0]);
                        up.stop();
                    }

                },
                beforeUploadCallback:null,
                progressCallback:function(file){
                    $(".zyupUnCompleteLi[data-file-id='"+file.id+"']").find(".zyupPercent").text(file.percent+"%");
                },
                uploadedCallback:function(file,info){

                    var res = JSON.parse(info);
                    var path = config.qiNiu.bucketDomain + res.key; //获取上传成功后的文件的Url

                    //判断是否是1：1
                    $.get(path+"?imageInfo",function(data){
                        //console.log(data);
                        if(data.width==600&&data.height==400){
                            $(".zyupUnCompleteLi[data-file-id='"+file.id+"']").find(".zyupPercent").html("<img style='height:40px' src='"+path+"'>").
                                end().addClass("zyupMediaItem").removeClass("zyupUnCompleteLi");
                            $(".zyupDelete.zyupHidden").removeClass("zyupHidden");
                            me.uploadedMedia[file["id"]]={
                                media_filename:file.name,
                                media_file:path
                            }
                        }else{
                            $().toastmessage("showErrorToast",config.message.imageNot600x400.replace("${filename}",file.name));
                            $(".zyupUnCompleteLi[data-file-id='"+file.id+"']").remove();
                        }
                    });

                }
            });
        },
        deleteFile:function(el){
            var parentLi=$(el).parent("li"),
                fileId=parentLi.data("file-id");
            parentLi.remove();
            this.uploadedMedia[fileId]=undefined;
            delete this.uploadedMedia[fileId];
        },
        stepHandler:function(stepId){
            showStepPanel(stepId);
        },
        formSubmit:function(form){
            Functions.showLoading();
            var files=[];
            for(var obj in this.uploadedMedia){
                files.push(this.uploadedMedia[obj]);
            }
            form.ajaxSubmit({
                dataType:"json",
                headers:{
                    "X-Requested-With":"XMLHttpRequest"
                },
                data:{
                    theme_tag:$("#zyupCategorySel").val().join(","),
                    material_tag:$("#zyupMaterialSel").val().join(","),
                    assets:JSON.stringify(files)
                },
                success:function(response){
                    if(response.success){
                        //Functions.hideLoading();
                        $().toastmessage("showSuccessToast",config.message.optSuccRedirect);
                        Functions.timeoutRedirect("artifacts/mgr");
                    }else{
                        Functions.ajaxReturnErrorHandler(response.error_code);
                    }
                },
                error:function(){
                    Functions.ajaxErrorHandler();
                }
            });
        },
        getPost:function(id){
            var me=this;
            $.ajax({
                url:config.ajaxUrls.getPost.replace(":postId",id),
                dataType:"json",
                type:"get",
                success:function(response){
                    if(response.success){
                        var length=response.artifact.assets.length;
                        for(var i=0;i<length;i++){
                            me.uploadedMedia[i+1]=response.artifact.assets[i];
                        }
                    }else{
                        Functions.ajaxReturnErrorHandler(response.error_code);
                    }
                },
                error:function(){
                    Functions.ajaxErrorHandler();
                }
            });
        }
    }
})();

$(document).ready(function(){

    //步骤控制
    $("#zyupTab a").click(function(){
        postUpdate.stepHandler($(this).attr("href"));

        return false;
    });

    $("#zyupMediaList").on("click",".zyupDelete",function(){
        postUpdate.deleteFile($(this));
    });

    postUpdate.createUploader();
    postUpdate.createFileUploader();
    postUpdate.createThumbUploader();

});