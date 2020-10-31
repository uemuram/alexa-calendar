echo "[start]"

bucket_name=$1
echo delete bucket ${bucket_name}

# get id
versionId=`aws s3api list-object-versions --bucket ${bucket_name} | jq -r '.Versions[].VersionId'`
echo ${versionId}

# delete
aws s3api delete-object --bucket ${bucket_name} --key "endpoint/build.zip" --version-id ${versionId}
aws s3 rb s3://${bucket_name}

echo "[end]"